/**
 * The type of the parser's output.
 */
export type Rule = CSSRule | KeyframeAtRule | ConditionalAtRule;

/**
 * This type stands of a common CSS style rule. The rule that declares CSS
 * properties and values.
 */
export type CSSRule = {
    type: 'cssRule',
    selectors: string[],
    decalrations: { property: string, value: string }[]
};

/** 
 * This type stands for the '@keyframes' At-Rule. 
 * 1. All blanks and return characters in the decalaration body will be reserved.
 * 2. The content of the decalaration is not parsed. The whole decalaration will
 *    be store into the property "declr", as a string.
 */
export type KeyframeAtRule = {
    type: '@keyframes',
    name: string,
    declr: string;
};

export type ConditionalAtRule = {
    type: '@media' | '@support',
    conditions: string,
    rules: Rule[]
};


/**
 * This parser should only be used for the function addScopeToCssRule.
 */
export class CSSRuleSetParser {
    private rules : string;
    private cursor : number = 0;
    private result : null | Rule[] = null;
    private braceParser : NestedBraceParser = new NestedBraceParser();

    constructor (rules : string) {
        this.rules = rules;
    }

    parse () {
        if (this.result !== null) {
            return this.result;
        }

        this.result = [];
        
        // We make an assumption that the input CSS rules are correct. It neither
        // has any syntax errors, nor has any sematic errors (e.g. unknown properties,
        // illegal units).

        return this.parseRuleSet();
    }

    private parseRuleSet () : Rule[] {
        this.skipWhitespacesAndBreaks();

        // If you meet a '}'. You must be reach the end of a rule set, which belongs
        // to a ConditionalRuleSet, e.g. @media, @support.
        while (this.cursor < this.rules.length && this.rules[this.cursor] !== '}') {
            let rule : Rule = this.parseRule();
            this.skipWhitespacesAndBreaks();
            this.result.push(rule);
        }

        return this.result;
    }

    private skipWhitespacesAndBreaks () {
        while (this.cursor < this.rules.length && this._isWhitespaceOrBreak(this.rules[this.cursor])) {
            this.cursor++;
        }
    }

    private parseRule () : Rule {
        // Is it a At-Rule, or is just a CSS rule?
        // If it is a CSS rule, parse it
        // If it is a At-Rule, call the correspondent parser.
        if (this.rules[this.cursor] === '@') {
            let atRuleName = this._parseTheNameOfAtRule();
            this.skipWhitespacesAndBreaks();
            
            switch (atRuleName) {
                case '@media':
                case '@support':
                    const start = this.cursor;
                    this._moveCursorUntil(ch => ch === '{');
                    const conditions = this.rules.slice(start, this.cursor);
                    
                    this.cursor++;
                    const rules = this.parseRuleSet();

                    return {
                        type: atRuleName,
                        conditions,
                        rules
                    };
                case '@keyframes':
                    const animationName = this._parseKeyframesIdent();
                    const keyframesDeclr = this._parseKeyframesDeclr();
                    return {
                        type: '@keyframes',
                        name: animationName,
                        declr: keyframesDeclr
                    };
                default:
                    throw new Error([
                        `The At-Rule "${atRuleName}" is not supported.` +
                        `Currently supported At-Rules are @media, @support and @keyframes.`
                    ].join('\n'));
            }
        } else {
            return this._parseCSSRule();
        }
    }

    private _moveCursorUntil (shouldStop : (ch : string) => boolean) : void {
        while (this.cursor < this.rules.length && !shouldStop(this.rules[this.cursor])) {
            this.cursor++;
        }
    }

    private _parseTheNameOfAtRule () : string {
        let start : number = this.cursor;
        this._moveCursorUntil(this._isWhitespaceOrBreak.bind(this));
        return this.rules.slice(start, this.cursor);
    }

    private _parseKeyframesIdent () : string {
        const ESCAPE = '\\';
        let END_CHAR; // The char indicates the end of the keyframes ident.
        let currentChar = this._getCurrentChar();
        let start = this.cursor;

        if (currentChar === '"' || currentChar === '\'') {
            // Situation One: the identification is quoted.
            // e.g. @keyframes "fade out" { ... }
            END_CHAR = currentChar;
            this.cursor++; // skip the start quote.
        } else {
            // Situation Two: the identification is not quoted.
            // e.g. @keyframes fade-out { ... }
            END_CHAR = ' ';
        }

        while (true) {
            currentChar = this._getCurrentChar();
            if (currentChar === ESCAPE) {
                // If a character is escaped, it won't be the end char,
                // so we can skip it with the escape character together.
                this.cursor += 2;
            } else if (currentChar === END_CHAR) {
                break;
            } else {
                this.cursor++;
            }
        }

        if (currentChar === '"' || currentChar === '\'') {
            this.cursor++; // Skip the end quote.
        }

        this.skipWhitespacesAndBreaks(); 

        return this.rules.slice(start, this.cursor);
    }

    private _parseKeyframesDeclr() : string {
        this.braceParser.parse(this.rules, this.cursor);
        this.cursor = this.braceParser.getEndPos();
        return this.braceParser.getParsedString();
    }

    private _parseListOfSelectors () : string[] {
        // Assumed we have skipped all whitespaces
        // and return characters.
        let selectors = [];

        while (this._getCurrentChar() !== '{') {
            let start = this.cursor;

            // A ',' will shows up between two selectors, and
            // a ';' will shows up at the end of the selector
            // list.
            while (this._getCurrentChar() !== ',' && this._getCurrentChar() !== '{') {
                this.cursor++;
            }

            let sel = this.rules.slice(start, this.cursor);
            selectors.push(sel.trim());
        }

        return selectors;
    }

    private _parseDecalarations () : { property: string, value: string }[] {
        /**
         * Assumed we have skipped all whitespaces and breaks.
         * A decalaration is something like following example:
         * `color : red;`
         */
        let decalarations : { property: string, value: string }[] = [];

        while (this._getCurrentChar() !== '}') {
            let property, value, start;

            start = this.cursor;
            this._moveCursorUntil(ch => ch === ':');
            property = this.rules.slice(start, this.cursor).trim();

            this.cursor++; // skip the colon
            this.skipWhitespacesAndBreaks();

            start = this.cursor;
            this._moveCursorUntil(ch => ch === ';')
            value = this.rules.slice(start, this.cursor).trim();

            decalarations.push({
                property,
                value
            });
        }
        return decalarations;
    }

    // FIXME
    private _parseCSSRule () : CSSRule {
        /**
         * A CSS Rule can be seen as two parts, the selector group,
         * and the declaration block.
         */

        this.skipWhitespacesAndBreaks();
        const selectors = this._parseListOfSelectors();
        
        // After parsing selectors, the cursor should pause on a '{'.
        // We need to skip it.
        this.cursor++;

        this.skipWhitespacesAndBreaks();
        const declarations = this._parseDecalarations();

        // After parsing decalarations, the cursor should pause on a '}'.
        // We need to skip it.
        this.cursor++;

        return {
            type: 'cssRule',
            selectors: selectors,
            decalrations: declarations
        };
    }

    private _isWhitespaceOrBreak (ch : string) {
        return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';
    }

    private _getCurrentChar () {
        return this.rules[this.cursor];
    }
}

/**
 * This parser can parse content wrapped with nested braces.
 * For example, if there is a string 'div { a { b.c.de } } e',
 * after parsing it, we will have a result of '{ a { b.c.de } }'.
 */
class NestedBraceParser {
    private startPos : number;
    private cursor : number;
    private str : string;

    private numberOfOpenBraces : number;

    public parse (str : string, start : number) : void {
        this.str = str;
        this.startPos = start;
        this.cursor = start;
        this.numberOfOpenBraces = 0;

        this.parseNestedBraces();
    }

    public getParsedString () : string {
        return this.str.slice(this.startPos, this.cursor);
    }

    public getEndPos () : number {
        return this.cursor;
    }

    private parseNestedBraces () : void {
        const ESCAPE = '\\';

        // First, we need to find the first left brace.
        //
        // Because we always encounter the escape character first, and after
        // finding it, we skip it with the next character (the one that is
        // escaped) together. So, our cursor will never be positioned at a
        // escaped '{'. Therefore, when the cursor points at a '{', we find
        //  a unescaped '{', the real first '{' we are looking for.
        while (this.cursor < this.str.length && this.str[this.cursor] !== '{') {
            if (this.str[this.cursor] === ESCAPE) {
                this.cursor += 2;
            } else {
                this.cursor++;
            }
        }

        if (this.cursor === this.str.length) {
            return;
        }

        this.numberOfOpenBraces++;
        while (this.cursor < this.str.length && this.numberOfOpenBraces > 0) {
            if (this.str[this.cursor] === '{') {
                this.numberOfOpenBraces++;
            } else if (this.str[this.cursor] === '}') {
                this.numberOfOpenBraces--;
            }
            this.cursor++;
        }
    }
}
