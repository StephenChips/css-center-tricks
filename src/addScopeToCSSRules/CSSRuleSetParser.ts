import { hasOwnProperty } from "../utils";
import { Rule, Declaration, CSSRule, AnimationDef as AnimationDef, AnimationProperty } from "./Rule";

type Nullable<T extends object> = { [prop in keyof T]: T[prop] | null };

const MAP_KEYWORD_TO_PROP = new Map<string, AnimationProperty>([
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
    [ 'paused', 'play-state'],
    [ 'infinite', 'iteration-count' ]
]);


/**
 * This parser should only be used for the function addScopeToCssRule.
 */
export class CSSRuleSetParser {
    private hasParsed : boolean = false;
    private rules : string;
    private cursor : number = 0;
    private result : Rule[];
    private braceParser : NestedBraceParser = new NestedBraceParser();
    private animationValueParser : AnimationDefsParser = new AnimationDefsParser();

    constructor (rules : string) {
        this.rules = rules;
    }

    public parse () {
        if (this.hasParsed) {
            return this.result;
        }

        this.result = [];
        
        // We make an assumption that the input CSS rules are symatically correct, which
        // means it can be parsed correctly by any CSS parser. Beware that there may be
        // some sematic errors in the input, e.g. unknown properties, invalid values.
        // They will not make our parser throws error.

        this.result = this.parseRuleSet();
        this.hasParsed = true;
        return this.result;
    }

    private parseRuleSet () : Rule[] {
        let ruleSet = [];
        this.skipWhitespacesAndBreaks();

        // There are two situations indicates you will reach at the end of a Rule Set.
        // One situation is that you reach the end of the parsing string.
        // The other situation is that you encounter an right-brace '}' character.
        // The reason of the second situation is that a Rule Set can be embraced inside
        // a @media or @supported At-Rule by an pair of braces.
        while (this.cursor < this.rules.length && this.rules[this.cursor] !== '}') {
            let rule : Rule = this.parseRule();
            this.skipWhitespacesAndBreaks();
            ruleSet.push(rule);
        }

        return ruleSet;
    }

    private skipWhitespacesAndBreaks () {
        this.cursor = skipWhitespacesAndBreaks(this.rules, this.cursor);
    }

    private parseRule () : Rule {
        // Which is it? An At-Rule, or a CSS rule?
        if (this.rules[this.cursor] === '@') {
            // We can peek the first character to see if it is an At-Rule.
            // If it is, we deal with it according to the At-Rule's name.
            let atRuleName = this.parseTheNameOfAtRule();
            this.skipWhitespacesAndBreaks();
            
            switch (atRuleName) {
                case '@media':
                case '@supports':
                    const start = this.cursor;
                    this.moveCursorUntil(ch => ch === '{');
                    const conditions = this.rules.slice(start, this.cursor);
                    
                    this.cursor++; // skip the left brace

                    // the cursor should end up at a left brace
                    // after we parsed a rule set.
                    const rules = this.parseRuleSet();

                    this.cursor++ // skip the right brace

                    return {
                        type: atRuleName,
                        conditions,
                        rules
                    };
                case '@keyframes':
                    const animationName = this.parseKeyframeIdent();
                    this.skipWhitespacesAndBreaks();
                    const keyframesDeclr = this.parseKeyframeDeclr();
                    return {
                        type: '@keyframes',
                        name: animationName,
                        decalration: keyframesDeclr
                    };
                default:
                    throw new Error([
                        `The At-Rule "${atRuleName}" is not supported.` +
                        `Currently supported At-Rules are @media, @supports and @keyframes.`
                    ].join('\n'));
            }
        } else {
            // Otherwise, it is a CSS rule. we parse it.
            return this.parseCSSRule();
        }
    }

    private moveCursorUntil (shouldStop : (ch : string) => boolean) : void {
        this.cursor = moveCursorUntil(this.rules, this.cursor, shouldStop);
    }

    private parseTheNameOfAtRule () : string {
        let start : number = this.cursor;
        this.moveCursorUntil(this.isWhitespaceOrBreak.bind(this));
        return this.rules.slice(start, this.cursor);
    }

    private parseKeyframeIdent () : string {
        // Well, a keyframe's identifier can be seen as a CSS <custom-ident>,
        // which is one kind of CSS value.
        let parseResult = parseSingleCSSValue(this.rules, this.cursor, new Set([ ' ' ]));
        this.cursor = parseResult.cursor;

        return parseResult.result;
    }

    private parseKeyframeDeclr() : string {
        this.braceParser.parse(this.rules, this.cursor);
        this.cursor = this.braceParser.getEndPos();
        return this.braceParser.getParsedString();
    }

    private parseListOfSelectors () : string[] {
        // We assumed we have skipped all whitespaces
        // and return characters.
        let selectors = [];

        while (this.getCurrentChar() !== '{') {
            let start = this.cursor;

            // The character ',' will show up between two selectors, and
            // the character '{' will show up at the end of the selector list.
            this.moveCursorUntil(ch => ch === ',' || ch === '{');

            let sel = this.rules.slice(start, this.cursor);
            selectors.push(sel.trim());

            if (this.getCurrentChar() === ',') {
                this.cursor++;
                this.skipWhitespacesAndBreaks();
            }
        }

        return selectors;
    }

    private parseDeclarations () : Declaration[] {
        /**
         * We assumed we have skipped all whitespaces and breaks.
         * A decalaration is something like following:
         * `color : red;`
         */
        let declarations : Declaration[] = [];

        this.skipWhitespacesAndBreaks();

        while (this.getCurrentChar() !== '}') {
            // Parse the <property>:<value>; pair.
            let start = this.cursor;
            this.moveCursorUntil(ch => ch === ':');
            let property = this.rules.slice(start, this.cursor).trim();

            this.cursor++;
            this.skipWhitespacesAndBreaks();

            start = this.cursor;
            this.moveCursorUntil(ch => ch === ';');
            let value = this.rules.slice(start, this.cursor).trim();

            this.cursor++;
            this.skipWhitespacesAndBreaks();

            // Determine the type of the declaration.
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
                });
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

    private parseCSSRule () : CSSRule {
        /**
         * A CSS Rule can be seen as two parts, the selector group,
         * and the declaration block.
         */

        this.skipWhitespacesAndBreaks();
        const selectors = this.parseListOfSelectors();
        
        // After parsing selectors, the cursor should pause on a '{'.
        // We need to skip it.
        this.cursor++;

        this.skipWhitespacesAndBreaks();
        const declarations = this.parseDeclarations();

        // After parsing decalarations, the cursor should pause on a '}'.
        // We need to skip it.
        this.cursor++;

        return {
            type: 'cssRule',
            selectors: selectors,
            decalrations: declarations
        };
    }

    private isWhitespaceOrBreak (ch : string) {
        return / |\t|\r|\n|\v|\f/.test(ch);
    }

    private getCurrentChar () {
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

        // First, we need to find the first left brace that are not escaped.
        while (this.cursor < this.str.length && this.str[this.cursor] !== '{') {
            if (this.str[this.cursor] === ESCAPE) {
                this.cursor++;
            }
            this.cursor++;
        }

        if (this.cursor === this.str.length) {
            return;
        }

        this.numberOfOpenBraces = 1;
        this.cursor++;

        while (this.cursor < this.str.length && this.numberOfOpenBraces > 0) {
            if (this.str[this.cursor] === ESCAPE) {
                this.cursor++;
            } else if (this.str[this.cursor] === '{') {
                this.numberOfOpenBraces++;
            } else if (this.str[this.cursor] === '}') {
                this.numberOfOpenBraces--;
            }
            this.cursor++;
        }
    }
}

class AnimationDefsParser {
    public parse (str : string) : AnimationDef[] {
        // We can promise that after the process, all
        // animation values are retained, so none of
        // them could be null or undefined.
        const listDefs = this.parseDefsToList(str);
        return listDefs.map(this.createDefFromList.bind(this));
    }

    
    private createDefFromList (valueList : string[]) : AnimationDef {
        let result : Nullable<AnimationDef>;

        if (valueList.length === 8) {
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
        } else if (valueList.length === 4) {
            result = {
                'duration': null,
                'timing-function': null,
                'delay': null,
                'name': null
            };
        } else if (valueList.length === 2) {
            result = {
                'duration': null,
                'name': null
            };
        } else {
            throw new Error('Illegal animation value');
        }
    
        for (let value of valueList) {
            // We have a value, but we don't know which property we can apply it to.
            // So we run following function to get the answer.
            const proplist = this.getApplicableProperties(value);
            let noSuitableProp = true;

            // The `proplist` has all applicable properties. But some of them may not
            // required by the AnimationDef, so we have to check them one by one.
    
            for (let i = 0; i < proplist.length; i++) {
                let PROP = proplist[i];
                if (hasOwnProperty(result, PROP)) {
                    // We need this property and its value hasn't been discovered yet.
                    if (result[PROP] === null) {
                        result[PROP] = value;
                        noSuitableProp = false;
                        break;
                    }
                }
            }

            if (noSuitableProp) {
                throw new Error('Illegal animation value');
            }
        }

        // At the end, all property should be found, none of them should be null.
        // But typescript compiler doesn't knows that, so we have to type-cast
        // the result. 
        return result as AnimationDef;
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
        let type : AnimationProperty = MAP_KEYWORD_TO_PROP.get(value) as AnimationProperty;
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
        return /none|initial|inherit|unset/.test(value);
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

    private parseDefsToList (str : string) : string[][] {
        let cursor = 0;
        let result = [];

        cursor = skipWhitespacesAndBreaks(str, cursor);
        while (cursor < str.length) {
            let list = [];
            while (cursor < str.length && str[cursor] !== ',') {
                let parsedResult = parseSingleCSSValue(str, cursor, new Set([ ',' ]));
                cursor = skipWhitespacesAndBreaks(str, parsedResult.cursor);
                list.push(parsedResult.result);
            }

            if (cursor < str.length) {
                cursor++; // skip the colon or semicolon;
                cursor = skipWhitespacesAndBreaks(str, cursor);
            }
            result.push(list);
        }

        return result;
    }
}

/**
 * Parse a CSS value.
 * e.g. 2s 1px "fade out" left
 * @param str string to be parsed.
 * @param cursor the start position to parse
 * @param followSet a set of characters that may appear right after a CSS value.
 */
function parseSingleCSSValue (str : string, cursor : number, followSet : Set<string>) {
    const ESCAPE = '\\';
    let isEndsWithQuote = false;
    let quote : string = ''; // The char indicates the end of a value.
    let currentChar = str[cursor];
    let start = cursor;

    if (currentChar === '"' || currentChar === '\'') {
        // Situation One: the value is quoted.
        // e.g. animation-name: "fade out" { ... }
        isEndsWithQuote = true;
        quote = currentChar;
        cursor++; // skip the start quote.
    }

    while (cursor < str.length) {
        currentChar = str[cursor];
        if (currentChar === ESCAPE) {
            // If a character is escaped, it won't be the end char,
            // so we can skip it with the escape character together.
            cursor += 2;
        } else if (isEndsWithQuote && currentChar === quote) {
            break;
        } else if (!isEndsWithQuote && (isWhitespaceOrBreak(currentChar) || followSet.has(currentChar))) {
            break;
        } else {
            cursor++;
        }
    }

    // The cursor will stop at the END_CHAR after the loop.
    if (isEndsWithQuote) {
        if (cursor >= str.length) {
            throw new Error('Missing quote');
        } else {
            cursor++; // Skip the end quote.
        }
    }

    return {
        result: str.slice(start, cursor),
        cursor
    };
}

function moveCursorUntil (str : string, cursor : number, shouldStop : (ch : string) => boolean) : number {
    while (cursor < str.length && !shouldStop(str[cursor])) {
        cursor++;
    }
    return cursor;
}

function skipWhitespacesAndBreaks (str : string, cursor : number) {
    return moveCursorUntil(str, cursor, ch => !isWhitespaceOrBreak(ch));
}

function isWhitespaceOrBreak (ch : string) {
    return /[ \t\r\n\v\f]/.test(ch);
}
