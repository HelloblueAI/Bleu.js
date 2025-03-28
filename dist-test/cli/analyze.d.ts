import { BleuConfig } from '../types';
interface AnalyzeOptions {
    path: string;
    recursive: boolean;
    output: 'json' | 'text';
    config: BleuConfig;
}
export declare const analyze: {
    [key: string]: any;
    args: string[];
    version(str: string, flags?: string): /*elided*/ any;
    command(name: string, desc?: string, opts?: import("commander").CommandOptions): /*elided*/ any;
    arguments(desc: string): /*elided*/ any;
    parseExpectedArgs(args: string[]): /*elided*/ any;
    action(fn: (...args: any[]) => void): /*elided*/ any;
    option(flags: string, description?: string, fn?: ((arg1: any, arg2: any) => void) | RegExp, defaultValue?: any): /*elided*/ any;
    option(flags: string, description?: string, defaultValue?: any): /*elided*/ any;
    allowUnknownOption(arg?: boolean): /*elided*/ any;
    parse(argv: string[]): /*elided*/ any;
    parseOptions(argv: string[]): import("commander").ParseOptionsResult;
    opts(): {
        [key: string]: any;
    };
    description(str: string, argsDescription?: {
        [argName: string]: string;
    }): /*elided*/ any;
    description(): string;
    alias(alias: string): /*elided*/ any;
    alias(): string;
    usage(str: string): /*elided*/ any;
    usage(): string;
    name(str: string): /*elided*/ any;
    name(): string;
    outputHelp(cb?: (str: string) => string): void;
    help(cb?: (str: string) => string): never;
};
export declare function analyze(options: AnalyzeOptions): Promise<void>;
export {};
//# sourceMappingURL=analyze.d.ts.map