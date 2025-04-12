type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none' | 'verbose';

class Logger {
    private readonly prefix: string;
    private level: LogLevel;
    private readonly color: string;

    private levelColors: Record<LogLevel, string> = {
        debug: '#9E9E9E',   // Gray
        info: '#2196F3',    // Blue
        warn: '#FFC107',    // Amber
        error: '#F44336',   // Red
        verbose: "#916969",
        none: ''
    };

    constructor(options: { prefix?: string; level?: LogLevel; color?: string } = {}) {
        this.prefix = options.prefix || '[🔥 Logger]';
        this.level = options.level || 'debug';
        this.color = options.color || '#00BCD4'; // default prefix color
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: Record<LogLevel, number> = {
            none: 0,
            error: 1,
            warn: 2,
            info: 3,
            debug: 4,
            verbose: 5
        };
        return levels[level] <= levels[this.level];
    }

    private formatMessage(level: LogLevel, args: unknown[]): unknown[] {
        const timestamp = new Date().toISOString();
        const levelColor = this.levelColors[level] || this.color;

        const levelTag = `%c${this.prefix} [%c${level.toUpperCase()}%c] %c${timestamp}`;
        const styles = [
            `color: ${this.color}; font-weight: bold;`,
            `color: ${levelColor}; font-weight: bold;`,
            `color: ${this.color}; font-weight: normal;`,
            'color: gray; font-style: italic;'
        ];

        return [levelTag, ...styles, ...args];
    }

    verbose(...args: unknown[]) {
        if (this.shouldLog('verbose')) {
            console.debug(...this.formatMessage('verbose', args));
        }
    }

    debug(...args: unknown[]) {
        if (this.shouldLog('debug')) {
            console.debug(...this.formatMessage('debug', args));
        }
    }

    info(...args: unknown[]) {
        if (this.shouldLog('info')) {
            console.info(...this.formatMessage('info', args));
        }
    }

    warn(...args: unknown[]) {
        if (this.shouldLog('warn')) {
            console.warn(...this.formatMessage('warn', args));
        }
    }

    error(...args: unknown[]) {
        if (this.shouldLog('error')) {
            console.error(...this.formatMessage('error', args));
        }
    }

    setLevel(level: LogLevel) {
        this.level = level;
    }

    disable() {
        this.level = 'none';
    }

    enable(level: LogLevel = 'debug') {
        this.level = level;
    }
}

export const log = new Logger({
    prefix: '[📦 Registron]',
    level: 'debug',
    color: '#4CAF50'
});
