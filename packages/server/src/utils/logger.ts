// ============================================
// FlowForge — Logger Utility
// ============================================
// A simple, color-coded logger for development.
// Usage: import { logger } from './logger';
//        logger.info('Server started');
//        logger.error('Something broke', error);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function getTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export const logger = {
  info(message: string, ...args: unknown[]) {
    console.log(
      `${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.blue}INFO${colors.reset}  ${message}`,
      ...args,
    );
  },

  success(message: string, ...args: unknown[]) {
    console.log(
      `${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.green}OK${colors.reset}    ${message}`,
      ...args,
    );
  },

  warn(message: string, ...args: unknown[]) {
    console.warn(
      `${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.yellow}WARN${colors.reset}  ${message}`,
      ...args,
    );
  },

  error(message: string, ...args: unknown[]) {
    console.error(
      `${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.red}ERROR${colors.reset} ${message}`,
      ...args,
    );
  },

  debug(message: string, ...args: unknown[]) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.magenta}DEBUG${colors.reset} ${message}`,
        ...args,
      );
    }
  },
};
