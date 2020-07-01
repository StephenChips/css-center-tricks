import { hasOwnProperty } from "../utils";
import { Rule, Declaration, CSSRule, AnimationValue, AnimationProperty } from "./Rule";

type Nullable<T extends object> = { [prop in keyof T]: T[prop] | null };

/**
 * This parser should only be used for the function addScopeToCssRule.
 */
export class CSSRuleSetParser {
    private rules : string;
    private cursor : number = 0;
    private result : Rule[];
    private braceParser : NestedBraceParser = new NestedBraceParser();
    private animationValueParser : AnimationValueParser = new AnimationValueParser();

    constructor (rules : string) {
        this.rules = rules;
    }

    public parse () {
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
        // Which is it? An At-Rule, or a CSS rule?
        if (this.rules[this.cursor] === '@') {
            // We can peek the first character to see if it is an At-Rule.
            // If it is, we deal with it according to the At-Rule's name.
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
                    const animationName = this._parseKeyframeIdent();
                    const keyframesDeclr = this._parseKeyframeDeclr();
                    return {
                        type: '@keyframes',
                        name: animationName,
                        decalration: keyframesDeclr
                    };
                default:
                    throw new Error([
                        `The At-Rule "${atRuleName}" is not supported.` +
                        `Currently supported At-Rules are @media, @support and @keyframes.`
                    ].join('\n'));
            }
        } else {
            // Otherwise, it is a CSS rule. we parse it.
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

    private _parseKeyframeIdent () : string {
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

    private _parseKeyframeDeclr() : string {
        this.braceParser.parse(this.rules, this.cursor);
        this.cursor = this.braceParser.getEndPos();
        return this.braceParser.getParsedString();
    }

    private _parseListOfSelectors () : string[] {
        // We assumed we have skipped all whitespaces
        // and return characters.
        let selectors = [];

        while (this._getCurrentChar() !== '{') {
            let start = this.cursor;

            // The character ',' will show up between two selectors, and
            // the character '{' will show up at the end of the selector list.
            while (this._getCurrentChar() !== ',' && this._getCurrentChar() !== '{') {
                this.cursor++;
            }

            let sel = this.rules.slice(start, this.cursor);
            selectors.push(sel.trim());
        }

        return selectors;
    }

    private _parseDeclarations () : Declaration[] {
        /**
         * We assumed we have skipped all whitespaces and breaks.
         * A decalaration is something like following:
         * `color : red;`
         */
        let declarations : Declaration[] = [];

        while (this._getCurrentChar() !== '}') {
            let start = this.cursor;
            this._moveCursorUntil(ch => ch === ':');
            let property = this.rules.slice(start, this.cursor).trim();

            this.cursor++; // skip the colon
            this.skipWhitespacesAndBreaks();

            start = this.cursor;
            this._moveCursorUntil(ch => ch === ';')
            let value = this.rules.slice(start, this.cursor).trim();

            if (property === 'animation') {
                declarations.push({
                    type: 'animation',
                    property: 'animation',
                    value: this.animationValueParser.parse(value)
                });
            } else if (property === 'animation-name') {
                declarations.push({
                    type: 'animation-name',
                    property: 'animation-name',
                    value: value.trim()
                })
            } else {
                declarations.push({
                    type: 'other',
                    property: property,
                    value: value.trim()
                });
            }
        }
        return declarations;
    }

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
        const declarations = this._parseDeclarations();

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

class AnimationValueParser {
    private animationValues : string[];

    private mapTypeOfKeyword = new Map<string, AnimationProperty>([
        [ 'ease', 'timing-function' ],
        [ 'ease-in', 'timing-function' ],
        [ 'ease-out', 'timing-function' ],
        [ 'ease-in-out', 'timing-function' ],
        [ 'linear', 'timing-function' ],
        [ 'step-start', 'timing-function' ],
        [ 'step-end', 'timing-function' ],
        [ 'initial', 'timing-function' ],
        [ 'unset', 'timing-function' ],
        [ 'inherit', 'timing-function' ],
        [ 'normal', 'direction' ],
        [ 'reverse', 'direction' ],
        [ 'alternate', 'direction' ],
        [ 'alternate-reverse', 'direction' ],
        [ 'none', 'fill-mode' ],
        [ 'forwards', 'fill-mode' ],
        [ 'backwards', 'fill-mode' ],
        [ 'both', 'fill-mode' ],
        [ 'running', 'play-state' ],
        [ 'pause', 'play-state'],
        [ 'infinite', 'iteration-count' ]
    ]);

    public parse (str : string) : AnimationValue {
        // We can promise that after the process, all
        // animation values are retained, so none of
        // them could be null or undefined.
        let result : Nullable<AnimationValue>;
        this.animationValues = str.split(' ');
        if (this.animationValues.length === 8) {
            result = {
                'name': null,
                'duration': null,
                'timing-function': null,
                'delay': null,
                'iteration': null,
                'iteration-count': null,
                'direction': null,
                'fill-mode': null,
                'play-state': null
            };
        } else if (this.animationValues.length === 4) {
            result = {
                'duration': null,
                'timing-function': null,
                'delay': null,
                'name': null
            };
        } else if (this.animationValues.length === 2) {
            result = {
                'duration': null,
                'name': null
            };
        } else {
            throw new Error('Illegal animation value');
        }
    
        for (let value of this.animationValues) {
            const proplist = this.getApplicableProperties(value);
            const LEN = proplist.length;
    
            for (let i = 0; i < LEN; i++) {
                const PROP = proplist[i];
                if (hasOwnProperty(result, PROP)) {
                    // We need this property
                    if (result[PROP] === null) {
                        // We have found another value for this property before.
                        continue;
                    } else {
                        // We haven't found value for this property.
                        // so we mark it as found.
                        result[PROP] = value;
                    }
                } else {
                    if (i < LEN - 1) {
                        // We don't need this property, try next one.
                        continue;
                    } else {
                        // We try all applicable properties but none
                        // of them are required. So we have to throw
                        // an error.
                        new Error('Illegal animation value');
                    }
                }
            }
        }

        // We know that all values are string now, so the "result" can be
        // regarded as "non-nullable" AnimationValue type. But typescript
        // compiler doesn't knows that, so we have to proceed a type cast.
        return result as AnimationValue;
    }

    /**
     * Given a value, it returns all possible `animation-*` properties
     * to which we can apply the value. There might be properties which
     * we CAN apply the value to, but we SHOULDN'T DO THAT, since that
     * property is not included in the shorthand, or its in the
     * shorthand, but some other property has higher applying priority,
     * "robbing" the value from it.
     *
     * For example:
     * ```
     * animation: 4s pause ease-in 1s
     * ```
     * The second value, `pause`, can be applied to `animation-play-state`
     * and `animation-name`. By specification, `animation-play-state` is
     * not included in a 4-values shorthand, so, it's actually the value
     * of `animation-name`.
     * 
     * On the other hand, the first value, `4s`, can be applied to
     * `animation-duration` as well as `animation-delay`. Again, by
     * specification, the former one has higher priority and we should
     * apply the value to it.
     */
    private getApplicableProperties (value : string) : AnimationProperty[] {
        // Check if the value is a <time> first.
        if (/^calc\(.+\)$/.test(value) || this.isTime(value)) {
            // animation-duration: 1s;
            // animation-duration: 100ms;
            // animation-duration: calc(0.1s * 20);
            return [ 'duration', 'delay' ];
        }
        
        // If not, check if it is a <number>.
        if (this.isNumberLiteral(value)) {
            // iteration-count: 10;
            return [ 'iteration-count' ];
        }

        // If not, check if it is a special function for `animation-timing-function`.
        if (/^cubic-bezier\(.+\)$/.test(value) || /^steps\(.+\)$/.test(value)) {
            return [ 'timing-function' ];
        }

        // If not, check if it is a special keyword for certain `animation-*` property.
        // We suppose the value is valid, so if it isn't a <time>, nor a <number>, nor a
        // <timing-function>, it can only be a <custom-ident>.
        let type : AnimationProperty = this.mapTypeOfKeyword.get(value) as AnimationProperty;
        if (typeof type === 'string') {
            if (this.isForbiddenWord(value)) {
                // animation-timing-function: unset;
                return [ type ];
            } else {
                // animatin-iteration-count: infinite;
                // animation-name: infinite;
                return [ type, 'name' ];
            }
        } 

        // If none of them are true, it will only be a value for `animation-name`
        return [ 'name' ];
    }

    private isNumberLiteral (value : string) : boolean {
        return !Number.isNaN(Number(value));
    }

    private isForbiddenWord (value : string) : boolean {
        return value === 'none' || value === 'initial' || value === 'inherit' || value === 'unset';
    }

    // Determine if a value is a <time>, e.g. 250ms, 0.13e4ms, 1.5s.
    private isTime (value : string) : boolean {
        if (value.length > 2 && value.endsWith('ms')) {
            return this.isNumberLiteral(value.slice(0, value.length - 2));
        }

        if (value.length > 1 && value.endsWith('s')) {
            return this.isNumberLiteral(value.slice(0, value.length - 1))
        }

        return false;
    }
}
