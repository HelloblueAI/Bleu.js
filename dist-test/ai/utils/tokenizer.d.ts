import { Tokenizer } from '../models/bleuAI';
export interface TokenizerConfig {
    vocabulary: string[];
    maxLength: number;
    specialTokens: {
        pad: string;
        unk: string;
        bos: string;
        eos: string;
    };
}
export declare function loadTokenizer(configPath: string): Promise<Tokenizer>;
//# sourceMappingURL=tokenizer.d.ts.map