"""Manage an allowlisted set of macOS Codex dotfiles; never traverse runtime state."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import shutil
import subprocess
import sys
import tempfile
import time

import tomlkit

ROOT = Path(__file__).resolve().parents[1]
MANAGED = ('config.toml', 'keybindings.json', 'hooks.json', 'AGENTS.md', 'rules/dotfiles.rules')
PROFILE = 'dotfiles'
LEGACY = ('sandbox_mode', 'sandbox_workspace_write')


class ConfigurationError(ValueError):
    """A diagnostic containing no config values and safe to show to the user."""


def codex_executable() -> str:
    """Prefer the runtime supplied by the Homebrew-installed ChatGPT app."""
    for app in (Path('/Applications/ChatGPT.app'), Path.home()/'Applications/ChatGPT.app'):
        executable = app/'Contents/Resources/codex'
        if executable.is_file() and os.access(executable, os.X_OK):
            return str(executable)
    raise ConfigurationError('ChatGPT app runtime not found. Install with brew install --cask chatgpt.')


def event(action: str, **fields: object) -> None:
    print(json.dumps({'action': action, **fields}, sort_keys=True))


def reject_inline_credentials(value: object) -> None:
    """Refuse to back up literal credentials in an otherwise ordinary config."""
    if isinstance(value, dict):
        for key, item in value.items():
            if re.search(r'(^|_)(api_key|token|password|secret)$|^authorization$', key, re.I):
                if item and not key.endswith(('_env_var', '_env')):
                    raise ConfigurationError('Inline credential field found; move it to a vault/environment reference before migration.')
            reject_inline_credentials(item)
    elif isinstance(value, list):
        for item in value:
            reject_inline_credentials(item)


def atomic_write(path: Path, content: str, mode: int = 0o600) -> None:
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    descriptor, temporary = tempfile.mkstemp(prefix='.codex-dotfiles-', dir=path.parent)
    try:
        with os.fdopen(descriptor, 'w') as stream:
            stream.write(content)
        os.chmod(temporary, mode)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def snapshot(path: Path) -> dict:
    if path.is_symlink():
        return {'kind': 'link', 'target': os.readlink(path)}
    if path.exists():
        if not path.is_file():
            raise ConfigurationError('A managed destination is a directory; resolve it before migration.')
        return {'kind': 'file', 'content': path.read_text(), 'mode': path.stat().st_mode & 0o777}
    return {'kind': 'absent'}


def fingerprint(state: dict) -> str:
    return hashlib.sha256(json.dumps(state, sort_keys=True).encode()).hexdigest()


def restore(path: Path, state: dict) -> None:
    if path.is_symlink():
        path.unlink()
    if state['kind'] == 'file':
        atomic_write(path, state['content'], state['mode'])
    elif state['kind'] == 'link':
        path.unlink(missing_ok=True)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.symlink_to(state['target'])
    else:
        path.unlink(missing_ok=True)


class Installation:
    def __init__(self, root: Path, home: Path, backups: Path):
        self.root, self.home, self.backups = root, home, backups
        # Stow folding or a symlinked Codex home would bring runtime data into Git.
        for directory in (home, home / 'rules'):
            if directory.is_symlink():
                raise ConfigurationError('Codex home and rules must be real directories, not folded Stow symlinks.')
        for name in ('config.toml', 'hooks.json', 'keybindings.json'):
            destination = home / name
            if destination.is_symlink() and destination.resolve() != (root / 'codex/.codex' / name).resolve():
                raise ConfigurationError(f'{name} links outside this Stow module; resolve it before migration.')

    def plan(self) -> tuple[dict, dict]:
        before, after = {}, {}
        if {entry.name for entry in (self.root / 'codex').iterdir()} - {'.codex', '.stow-local-ignore'}:
            raise ConfigurationError('Unexpected top-level file in the Codex Stow module; refusing to deploy it.')
        module = self.root / 'codex/.codex'
        for entry in module.rglob('*'):
            if entry.is_symlink() or (entry.is_file() and entry.relative_to(module).as_posix() not in MANAGED):
                raise ConfigurationError('Unmanaged file in the Codex Stow module; refusing to deploy it.')
        for name in MANAGED:
            source = module / name
            if not source.is_file():
                raise ConfigurationError('A managed Codex file is missing from dotfiles.')
            # Only these known configuration files are read. No runtime traversal.
            for candidate in (source, self.home / name):
                if candidate.is_file():
                    if name.endswith('.toml'):
                        reject_inline_credentials(tomlkit.parse(candidate.read_text()).unwrap())
                    elif name.endswith('.json'):
                        reject_inline_credentials(json.loads(candidate.read_text()))
            state = {'kind': 'link', 'target': os.path.relpath(source, (self.home / name).parent)}
            old = snapshot(self.home / name)
            if old != state:
                before[name], after[name] = old, state
        return before, after

    def apply(self) -> str | None:
        before, after = self.plan()
        if not after:
            event('unchanged')
            return None
        if not shutil.which('stow'):
            raise ConfigurationError('Missing required executable: stow')
        version = subprocess.run([codex_executable(), '--version'], capture_output=True, text=True, check=True).stdout
        numbers = re.search(r'(\d+)\.(\d+)\.(\d+)', version)
        if not numbers or tuple(map(int, numbers.groups())) < (0, 153, 1):
            raise ConfigurationError('Codex 0.153.1 or newer is required.')
        # Snapshot only the explicitly changed non-secret files, never the directory.
        migration = str(time.time_ns())
        record = {'home': str(self.home), 'before': before,
                  'after': {name: fingerprint(state) for name, state in after.items()},
                  'source_hashes': {name: hashlib.sha256((self.root/'codex/.codex'/name).read_bytes()).hexdigest() for name in after}}
        backup = self.backups / migration / 'migration.json'
        atomic_write(backup, json.dumps(record, indent=2) + '\n')
        for name in before:
            if snapshot(self.home / name) != before[name]:
                raise ConfigurationError('Configuration changed during migration; retry after closing settings.')
        try:
            for name, state in after.items():
                (self.home / name).unlink(missing_ok=True)
            self.home.mkdir(parents=True, exist_ok=True)
            subprocess.run(['stow', '--no-folding', '--dir', str(self.root), '--target', str(self.home.parent), 'codex'],
                           check=True, capture_output=True, text=True)
            if any(fingerprint(snapshot(self.home / name)) != record['after'][name] for name in after):
                raise ConfigurationError('Installed state did not match the preview.')
        except Exception:
            for name, state in before.items():
                restore(self.home / name, state)
            event('apply_failed_restored')
            raise
        event('applied', migration=migration, files=list(after))
        return migration

    def rollback(self, migration: str) -> None:
        if not migration.isdigit():
            raise ConfigurationError('Use the numeric migration ID printed by apply.')
        record = json.loads((self.backups / migration / 'migration.json').read_text())
        if record['home'] != str(self.home):
            raise ConfigurationError('Backup belongs to another Codex home.')
        allowed = set(MANAGED)
        if not set(record['before']).issubset(allowed):
            raise ConfigurationError('Backup contains an unmanaged destination.')
        for name in record['before']:
            source_changed = name in record.get('source_hashes', {}) and hashlib.sha256(
                (self.root/'codex/.codex'/name).read_bytes()).hexdigest() != record['source_hashes'][name]
            if fingerprint(snapshot(self.home / name)) != record['after'][name] or source_changed:
                raise ConfigurationError('Local settings changed since migration; refusing to overwrite them during rollback.')
        for name, state in record['before'].items():
            restore(self.home / name, state)
        event('rolled_back', migration=migration)


def doctor(home: Path) -> None:
    config = tomlkit.parse((home / 'config.toml').read_text()) if (home / 'config.toml').exists() else {}
    event('profile', selected=config.get('default_permissions'), legacy_override=any(k in config for k in LEGACY))
    for name in MANAGED:
        event('managed_file', file=name, linked=(home / name).is_symlink())
    event('skills', first_party_available=any((Path.home()/'.agents/skills').glob('*/SKILL.md')))
    # Presence only: never read plugin state or credentials.
    event('optional_integrations', plugin_cache_present=(home / 'plugins').is_dir(),
          cavecrew_hooks_present=(home / 'hooks/caveman-activate.js').is_file())
    event('scope', message='macOS local sandbox only; desktop task permission overrides and MCP/browser tools have separate controls.')


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['plan', 'apply', 'check', 'doctor', 'rollback'], nargs='?', default='plan')
    parser.add_argument('migration', nargs='?')
    args = parser.parse_args()
    if platform.system() != 'Darwin':
        raise ConfigurationError('Only macOS is supported.')
    # Honor a real Codex home, but Stow needs its standard basename.
    home = Path(os.environ.get('CODEX_HOME', str(Path.home()/'.codex'))).absolute()
    if home.name != '.codex':
        raise ConfigurationError('This Stow module requires a Codex home named .codex.')
    backups = Path.home()/'.local/share/dotfiles/codex-backups'
    installation = Installation(ROOT, home, backups)
    if args.action == 'doctor':
        doctor(home)
    elif args.action == 'rollback':
        if not args.migration:
            raise ConfigurationError('rollback requires a migration ID.')
        installation.rollback(args.migration)
    elif args.action == 'apply':
        installation.apply()
    else:
        _, after = installation.plan()
        event('drift' if after else 'unchanged', files=list(after))
        return int(args.action == 'check' and bool(after))
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        # Do not print config data, command output, or arbitrary TOML parser excerpts.
        event('error', kind=type(error).__name__, message=str(error) if isinstance(error, ConfigurationError) else 'Operation failed; no configuration values logged.')
        sys.exit(1)
