import { execa } from 'execa';
import emoji from 'node-emoji'
import chalk from 'chalk'

const firstLog = `${emoji.get('fast_forward')} ${chalk.yellow('Building...')}`
const secondLog = `${emoji.get('fast_forward')} ${chalk.yellow('Pushing...')}`
const thirdLog = `${emoji.get('rocket')} ${chalk.green('Your app successfully deployed')} ${emoji.get('rocket')}`

;(async () => {
  try {
    const { stdout: currentBranch } = await execa('git', ['branch', '--show-current'])
    await execa('git', ['checkout', '--orphan', 'gh-pages'])
    console.log(firstLog)
    await execa('pnpm', ['compiler'], { stdio: 'inherit' })

    await execa('git', ['--work-tree', 'dist', 'add', '--all'])
    await execa('git', ['--work-tree', 'dist', 'commit', '-m', '"gh-pages"'])
    console.log(secondLog)

    await execa('git', ['push', 'origin', 'HEAD:gh-pages', '--force'], { stdio: 'inherit' })
    await execa('rm', ['-r', 'dist'])
    await execa('git', ['checkout', '-f', currentBranch])
    await execa('git', ['branch', '-D', 'gh-pages'])
    console.log(thirdLog)

  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
})()