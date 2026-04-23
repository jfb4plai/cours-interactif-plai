const path = require('path');
process.chdir(path.join(__dirname));
require('child_process').spawn('npx', ['next', 'dev', '--port', '3461'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});
