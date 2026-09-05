"""Offline migration tests. All paths and contents are synthetic fixtures."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import tomlkit

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('codex_config', ROOT/'scripts/codex-config.py')
config = importlib.util.module_from_spec(spec)
spec.loader.exec_module(config)


class MigrationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='codex-test-')
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.root = self.base/'dotfiles'
        shutil.copytree(ROOT/'codex', self.root/'codex')
        self.home = self.base/'user' / '.codex'
        self.home.mkdir(parents=True)
        self.install = config.Installation(self.root, self.home, self.base/'backups')
        self.output = io.StringIO()
        # Keep CLI-style events out of test output.
        self.redirect = contextlib.redirect_stdout(self.output)
        self.redirect.__enter__()
        self.addCleanup(self.redirect.__exit__, None, None, None)

    def test_edits_through_home_config_reach_the_repository(self):
        self.install.apply()
        destination = self.home/'config.toml'
        source = self.root/'codex/.codex/config.toml'
        self.assertEqual(destination.resolve(), source.resolve())
        document = tomlkit.parse(destination.read_text())
        document['model_reasoning_effort'] = 'medium'
        destination.write_text(tomlkit.dumps(document))
        self.assertEqual(tomlkit.parse(source.read_text())['model_reasoning_effort'], 'medium')
        self.assertIsNone(self.install.apply())

    def test_plan_is_read_only_and_does_not_visit_runtime(self):
        runtime = self.home/'unmanaged-runtime'
        runtime.mkdir()
        (runtime/'opaque-state').write_text('fixture state')
        before, after = self.install.plan()
        self.assertIn('config.toml', after)
        self.assertFalse((self.base/'backups').exists())
        self.assertEqual(list(self.home.iterdir()), [runtime])

    def test_fresh_install_repeat_and_rollback(self):
        migration = self.install.apply()
        self.assertTrue((self.home/'AGENTS.md').is_symlink())
        for name in config.MANAGED:
            self.assertTrue((self.home/name).is_symlink(), name)
        self.assertFalse(self.home.is_symlink())
        self.assertFalse((self.home/'rules').is_symlink())
        self.assertFalse((self.home.parent/'config.toml').exists())
        self.assertIsNone(self.install.apply())
        self.install.rollback(migration)
        self.assertFalse((self.home/'config.toml').exists())
        self.assertFalse((self.home/'AGENTS.md').exists())

    def test_existing_configuration_and_instructions_restore_exactly(self):
        (self.home/'config.toml').write_text('model = "old"\n# comment\n')
        (self.home/'AGENTS.md').write_text('My original instructions\n')
        (self.home/'rules').mkdir()
        (self.home/'rules/default.rules').write_text('# local rules\n')
        migration = self.install.apply()
        self.assertEqual((self.home/'rules/default.rules').read_text(), '# local rules\n')
        self.install.rollback(migration)
        self.assertEqual((self.home/'config.toml').read_text(), 'model = "old"\n# comment\n')
        self.assertEqual((self.home/'AGENTS.md').read_text(), 'My original instructions\n')

    def test_rollback_refuses_new_local_edits(self):
        migration = self.install.apply()
        with (self.home/'config.toml').open('a') as stream:
            stream.write('\n# later local change\n')
        with self.assertRaisesRegex(ValueError, 'changed since migration'):
            self.install.rollback(migration)

    def test_stow_failure_restores_previous_files(self):
        (self.home/'AGENTS.md').write_text('before')
        real_run = subprocess.run
        def fail_stow(command, **kwargs):
            if command[0] == 'stow':
                raise subprocess.CalledProcessError(1, command)
            return real_run(command, **kwargs)
        with patch.object(config.subprocess, 'run', side_effect=fail_stow):
            with self.assertRaises(subprocess.CalledProcessError):
                self.install.apply()
        self.assertEqual((self.home/'AGENTS.md').read_text(), 'before')
        self.assertFalse((self.home/'config.toml').exists())

    def test_stow_keeps_hooks_and_keybindings_in_repository(self):
        self.install.apply()
        for name in ('hooks.json', 'keybindings.json'):
            self.assertEqual((self.home/name).resolve(), (self.root/'codex/.codex'/name).resolve())
            json.loads((self.home/name).read_text())

    def test_literal_credential_fields_are_refused_without_echo(self):
        with self.assertRaises(ValueError) as error:
            config.reject_inline_credentials({'mcp': {'headers': {'Authorization': 'fixture-only'}}})
        self.assertNotIn('fixture-only', str(error.exception))
        config.reject_inline_credentials({'bearer_token_env_var': 'EXAMPLE_ENV'})

    def test_folded_directories_and_symlinked_config_are_refused(self):
        (self.home/'config.toml').symlink_to(self.base/'unrelated')
        with self.assertRaisesRegex(ValueError, 'outside this Stow module'):
            config.Installation(self.root, self.home, self.base/'backups')
        (self.home/'config.toml').unlink()
        (self.home/'rules').symlink_to(self.base)
        with self.assertRaisesRegex(ValueError, 'real directories'):
            config.Installation(self.root, self.home, self.base/'backups')

    def test_atomic_write_snapshot_and_link_restore(self):
        target = self.home/'AGENTS.md'
        config.atomic_write(target, 'fixture', 0o640)
        saved = config.snapshot(target)
        config.restore(target, {'kind': 'link', 'target': '../something'})
        self.assertTrue(target.is_symlink())
        config.restore(target, saved)
        self.assertEqual(config.snapshot(target), saved)

    def test_doctor_reports_only_presence(self):
        config.doctor(self.home)
        events = [json.loads(line) for line in self.output.getvalue().splitlines()]
        self.assertIn('scope', [item['action'] for item in events])

    def test_generated_policy_has_catalog_coverage(self):
        catalog = json.loads((ROOT/'agent-policy/catalog.json').read_text())
        document = tomlkit.parse((self.root/'codex/.codex/config.toml').read_text())
        fs = document['permissions']['dotfiles']['filesystem']
        for name in catalog['secrets']['homePaths'] + catalog['secrets']['systemPaths']:
            self.assertEqual(fs[name], 'deny')
        for name in catalog['secrets']['workspaceGlobs']:
            self.assertEqual(fs[':workspace_roots'][name], 'deny')

    def test_unmanaged_module_files_are_not_stowed(self):
        (self.root/'codex/.codex/runtime-fixture').write_text('unmanaged fixture')
        with self.assertRaisesRegex(ValueError, 'Unmanaged file'):
            self.install.plan()

    def test_unmanaged_top_level_files_are_not_stowed(self):
        (self.root/'codex/unexpected').write_text('unmanaged fixture')
        with self.assertRaisesRegex(ValueError, 'Unexpected top-level'):
            self.install.plan()

    def test_malformed_config_fails_before_backups_or_links(self):
        (self.home/'config.toml').write_text('[broken')
        with self.assertRaises(Exception):
            self.install.apply()
        self.assertFalse((self.base/'backups').exists())
        self.assertFalse((self.home/'AGENTS.md').exists())

    def test_codex_bootstrap_uses_only_requested_target(self):
        repo = self.base/'skills-repo'
        (repo/'scripts').mkdir(parents=True)
        (repo/'scripts/link-skills.sh').write_text('printf "%s\\n" "$@"\n')
        import os
        env = dict(os.environ, SKILLS_REPO=str(repo))
        result = subprocess.run(['bash', str(ROOT/'scripts/bootstrap-skills.sh'), '--codex', '--dry-run'],
                                env=env, capture_output=True, text=True, check=True)
        self.assertEqual(result.stdout.splitlines(), ['--target', str(Path.home()/'.agents/skills'), '--dry-run'])

    def test_runtime_resolution_uses_chatgpt_app_without_path_lookup(self):
        with patch.object(config.Path, 'is_file', return_value=True), patch.object(config.os, 'access', return_value=True):
            with patch.object(config.shutil, 'which', side_effect=AssertionError('Standalone CLI lookup is not expected')):
                self.assertEqual(config.codex_executable(), '/Applications/ChatGPT.app/Contents/Resources/codex')
        with patch.object(config.Path, 'is_file', return_value=False):
            with self.assertRaisesRegex(ValueError, 'brew install --cask chatgpt'):
                config.codex_executable()


if __name__ == '__main__':
    unittest.main()
