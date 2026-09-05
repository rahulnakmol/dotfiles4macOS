"""Exercise the real macOS sandbox against synthetic files, without model calls."""
import json
from pathlib import Path
import platform
import subprocess
import tempfile
import unittest

import tomlkit


@unittest.skipUnless(platform.system() == 'Darwin', 'macOS Seatbelt test')
class SandboxTests(unittest.TestCase):
    def test_generated_profile_restricts_reads_and_writes(self):
        root = Path(__file__).resolve().parents[1]
        shared = tomlkit.parse((root/'codex/.codex/config.toml').read_text())
        filesystem = tomlkit.inline_table()
        filesystem.update(shared['permissions']['dotfiles']['filesystem'].unwrap())
        with tempfile.TemporaryDirectory(prefix='codex-policy-test-') as directory:
            workspace = Path(directory)
            expected = {'ordinary.txt': True, '.env': False, 'nested/.env': False,
                        'fixture.pem': False, 'fixture.tfvars': False, '.env.example': False}
            for name in expected:
                destination = workspace/name
                destination.parent.mkdir(exist_ok=True)
                destination.write_text('synthetic test fixture, no credentials\n')
            command = ['codex', 'sandbox', '-P', 'dotfiles', '-C', directory,
                       '-c', 'permissions.dotfiles.extends=":workspace"',
                       '-c', 'permissions.dotfiles.filesystem=' + filesystem.as_string()]
            for name, allowed in expected.items():
                with self.subTest(file=name, operation='read'):
                    result = subprocess.run(command + ['/bin/cat', name], capture_output=True, text=True, timeout=15)
                    self.assertEqual(result.returncode == 0, allowed)
                    if not allowed:
                        self.assertEqual(result.stdout, '')
                        self.assertIn('Operation not permitted', result.stderr)
                with self.subTest(file=name, operation='write'):
                    result = subprocess.run(command + ['/bin/sh', '-c', 'printf fixture > "$1"', 'sh', name],
                                            capture_output=True, text=True, timeout=15)
                    self.assertEqual(result.returncode == 0, allowed)


if __name__ == '__main__':
    unittest.main()
