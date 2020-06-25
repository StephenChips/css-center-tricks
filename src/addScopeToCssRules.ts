/**
Add a "scope" to given CSS rules by appending an extra selector
at front. It limit the effective range of each CSS rule to curtain
elements, prevent it from overwrite some irrelative rules, causing
some quirky style problem.
 */
export function addScopeToCssRules (extraSelector, rules) {
    let parser = new SimpleCSSParser(rules);
    let ast = parser.parse();

    for (var rule of ast) {
        // Ignore CSS At-Rules, e.g. @keyframes, @media.
        if (rule.selectorGroup.startsWith('@')) {
            continue;
        } else {
            rule.selectorGroup = extraSelector + ' ' + rule.selectorGroup;
        }
    }

    return assembleSelectorsAndRules(ast);
}

/**
 * ### Short Introduction of CSS Syntax
 * 
 * A CSS rule is comprised of two part, the selector group and
 * the declaration block.
 * 
 * Take a simple CSS rule for example:
 * ```
 * div.flex, p.flex { display: flex; }
 * ```
 * 
 * In this case, the selector group is the part
 * `div.flex, p.flex`. Obvioiusly it consist of a chain of CSS
 * selectors, and the rest, the braces and the contents wrapped
 * inside it, is the declaration block, which defines CSS
 * properties and values.
 */

// The CSS parser outputs type type of rules. Each rule's has their own type
// and are described below.
type Rule = CSSRule | KeyframeAtRule | RuleSetAtRule;

// The first one, which is the commonest one, is the CSSRule. It contains a set of CSS
// decalarations, each of which declares a CSS property and a value.
// For example:
// ```
// div { display: block; }
// ```
// is a CSSRule.
type CSSRule = {
    type: 'cssRule',
    selectors: string[],
    decalrations: { property: string, value: string }[]
};
// Following type stands for the '@keyframes' At-Rule. After parsing,
// You will get the name and the decalaration body.
//
// For example, if you have a keyframes At-Rule:
// @keyframes fadeout { from { opacity: 1; } to { opacity: 0; } }
//
// After parsing, you should have a CSSRule object like this:
// { type: '@keyframes', name: 'fadeout', declr: '{ from { opacity: 1; } to { opacity: 0; } }' }
//
// Notice that all blanks and return characters in the decalaration body will be reserved. \
type KeyframeAtRule = {
    type: '@keyframes',
    name: string,
    declr: string;
};


// Following type stands for the '@media', '@support' and '@document' At-Rules.
// Each of these three At-Rules has an nested rule set, making the `Rule` type
// a recursive data type.
type RuleSetAtRule = {
    type: '@media' | '@support',
    conditions: string,
    rules: Rule[]
};


function parseRuleSet () {

}

function parseKeyframeAtRule () {

}

function parseCSSRule () {

}

function skipVoidAtRules () {

}

function skipNestedBraces () {

}

/**
 * This parser is tailor-make for the function addScopeToCssRule.
 * And thus should not be public.
 */
class SimpleCSSParser {
    private rules : string;
    private cursor : number = 0;
    private result : null | Rule[] = null;

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

        return this._parseRuleSet();
    }

    _parseRuleSet () : Rule[] {
        this._skipWhitespacesAndBreaks();

        /**
         * There are two situations shows the parsing should be terminated.
         * 1. Meet the end of the string
         * 2. Meet the character '}' 
         * 
         * // TODO
         */
        while (this.cursor < this.rules.length && this.rules[this.cursor] !== '}') {
            let rule : Rule = this._parseRule();
            this.result.push(rule);
            this._skipWhitespacesAndBreaks();
        }

        return this.result;
    }

    _skipWhitespacesAndBreaks () {
        while (this.cursor < this.rules.length && this._isWhitespaceOrBreak(this.rules[this.cursor])) {
            this.cursor++;
        }
    }

    _parseRule () : Rule {
        // Is it a At-Rule, or is just a CSS rule?
        // If it is a CSS rule, parse it
        // If it is a At-Rule, call the correspondent parser.
        if (this.rules[this.cursor] === '@') {
            let atRuleName = this._parseTheNameOfAtRule();
            this._skipWhitespacesAndBreaks();
            
            switch (atRuleName) {
                case '@media':
                case '@support':
                    const start = this.cursor;
                    this._skipUntil(ch => ch === '{');
                    const conditions = this.rules.slice(start, this.cursor);
                    
                    this.cursor++;
                    const rules = this._parseRuleSet();

                    return {
                        type: atRuleName,
                        conditions,
                        rules
                    };
                case '@keyframes':
                    const animationName = this._parseKeyframesName();
                    const keyframesDeclr = this._parseKeyframesDeclr();
                    return {
                        type: '@keyframes',
                        name: animationName,
                        declr: keyframesDeclr
                    }
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

    private _skipUntil (shouldStop : (ch : string) => boolean) : void {
        while (this.cursor < this.rules.length && !shouldStop(this.rules[this.cursor])) {
            this.cursor++;
        }
    }

    private _parseTheNameOfAtRule () : string {
        let start : number = this.cursor;
        this._skipUntil(this._isWhitespaceOrBreak.bind(this));
        return this.rules.slice(start, this.cursor);
    }

    private _parseKeyframesDeclr() : string {
        return '';
    }

    private _parseKeyframesName () : string {
        return '';
    }

    private _parseListOfSelectors () : string[] {
        return []
    }

    private _parseDecalarations () : { property: string, value: string }[] {
        return []
    }

    // FIXME
    private _parseCSSRule () : CSSRule {
        /**
         * A CSS Rule can be seen as two parts, the selector group,
         * and the declaration block.
         * 
         */

        this._skipWhitespacesAndBreaks();
        const selectors = this._parseListOfSelectors();
        
        // After parsing selectors, the cursor should pause on a '{'.
        // We need to skip it.
        this.cursor++;

        const declarations = this._parseDecalarations();

        // After parsing decalarations, the cursor should pause on a '}'.
        // We need to skip it.
        this.cursor++;

        return {
            type: 'cssRule',
            selectors: selectors,
            decalrations: declarations
        }
    }

    private _isWhitespaceOrBreak (ch) {
        return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';
    }
}

function assembleSelectorsAndRules(splited) {
    const joinSplitedRule = ({ selectorGroup, declarationBlock }) => selectorGroup + ' ' + declarationBlock;
    return splited.map(joinSplitedRule).join('\n');
}

