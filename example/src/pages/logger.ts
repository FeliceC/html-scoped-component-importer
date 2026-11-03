import { LogLevel } from '../../../src/index';
import { setupPage } from '../layout/setupPage';
import { logger } from '../shared';

setupPage();

const playgroundLogger = logger.withScope('🎚️ playground');
const LEVEL_MESSAGES = {
  [LogLevel.Debug]: 'Fine-grained detail for curious developers',
  [LogLevel.Info]: 'Something nice happened',
  [LogLevel.Warn]: 'Careful, this looks odd',
  [LogLevel.Error]: 'Something broke (on purpose)',
  [LogLevel.Celebrate]: 'Shipped it! 🎉\nCelebrations get their own banner style'
} as const;

document.querySelectorAll<HTMLButtonElement>('[data-level]').forEach(button => {
  const level = button.dataset.level as LogLevel;
  button.addEventListener('click', () => playgroundLogger[level](LEVEL_MESSAGES[level]));
});

const checkoutLogger = logger.withScope('🛒 checkout');
document.getElementById('scoped-log')!.addEventListener('click', () => checkoutLogger.info('Payment form ready'));
