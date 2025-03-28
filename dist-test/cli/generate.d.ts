import { BleuConfig } from '../types';
interface GenerateOptions {
    prompt: string;
    template: string;
    language: string;
    framework: string;
    config: BleuConfig;
}
export declare const generate: {
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
export declare function generate(options: GenerateOptions): Promise<void>;
export declare function generateCode(options: GenerateOptions): Promise<void>;
export {};
//# sourceMappingURL=generate.d.ts.map