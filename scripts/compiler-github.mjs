import { execa } from 'execa';

;(async () => {
  try {
    const { stdout: currentBranch } = await execa('git', ['branch', '--show-current'])
    await execa('git', ['checkout', '--orphan', 'gh-pages'])
    await execa('pnpm', ['compiler'], { stdio: 'inherit' })

    await execa('git', ['--work-tree', 'dist', 'add', '--all'])
    await execa('git', ['--work-tree', 'dist', 'commit', '-m', '"gh-pages"'])

    await execa('git', ['push', 'origin', 'HEAD:gh-pages', '--force'], { stdio: 'inherit' })
    await execa('rm', ['-r', 'dist'])
    await execa('git', ['checkout', '-f', currentBranch])
    await execa('git', ['branch', '-D', 'gh-pages'])

  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
})()