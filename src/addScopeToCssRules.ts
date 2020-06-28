import { CSSRuleSetParser, Rule, KeyframeAtRule } from './CSSRuleSetParser.js';

/**
By adding a scope, we limit the effective range of each CSS rule,
prevent it from effect some irrelative css rules that causes some
quirky style problem.

Technically. We add a class in front of each selector, and change
each animation names.
 */
export function addScopeToCssRules (scope : string, css : string) {
    let parser = new CSSRuleSetParser(css);
    let ruleSet : Rule[] = parser.parse();

    addScope(scope, ruleSet);

    return assembleSelectorsAndRules(ruleSet);
}

function addScope (scope : string, ruleSet : Rule[]) {
    type Decalaration = {
        property: string;
        value: string;
    };

    // This map will store every "animation" & "animaiton-name"
    // property we encounter during the iteration. Every properties
    // are grouped by its animation name.
    let animationMap = new Map<string, Decalaration[]>();

    // This map will store every @keyframes we encounter during
    // the iteration.
    let keyframesMap = new Map<string, KeyframeAtRule>();

    for (let rule of ruleSet) {
        if (rule.type === 'cssRule') {
            rule.selectors = rule.selectors.map(sel => `[data-${scope}] ${sel}`);

            for (let declr of rule.decalrations) {
                let animationName : string;
                if (declr.property === 'animation') {
                    animationName = getAnimationName(declr.value);
                } else if (declr.property === 'animation-name') {
                    animationName = declr.value.trim();
                }

                let listOfDeclr = animationMap.get(animationName);
                if (listOfDeclr === undefined) {
                    listOfDeclr = [];
                    animationMap.set(animationName, listOfDeclr);
                }

                listOfDeclr.push(declr);
            }
        } else if (rule.type === '@keyframes') {
            keyframesMap.set(rule.name, rule);
        } else {
            // '@media' && '@support'
            addScope(scope, rule.rules);
        }
    }
}

function getAnimationName (str : string) : string {
    let animationValues : string[] = str.split(' ');
    let hasFoundValueFor : { [prop : string] : boolean };

    // Define a map that save all possible keywords.
    let mapTypeOfKeyword = new Map([
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

    if (animationValues.length === 8) {
        hasFoundValueFor = {
            'duration': false,
            'timing-function': false,
            'delay': false,
            'iteration': false,
            'iteration-count': false,
            'direction': false,
            'fill-mode': false,
            'play-state': false
        };
    } else if (animationValues.length === 4) {
        hasFoundValueFor = {
            'duration': false,
            'timing-function': false,
            'delay': false,
            'name': false
        };
    } else if (animationValues.length === 2) {
        hasFoundValueFor = {
            'duration': false,
            'name': false
        };
    } else {
        throw new Error('Illegal animation value');
    }

    for (let value of animationValues) {
        const proplist = getApplicableProperties(value);
        const LEN = proplist.length;

        for (let i = 0; i < LEN; i++) {
            const PROP = proplist[i];
            if (PROP in hasFoundValueFor) {
                // We need that property
                if (hasFoundValueFor[PROP]) {
                    // We have found another value for this property before.
                    continue;
                } else if (PROP === 'name') {
                    return value;
                } else {
                    // We haven't found value for this property.
                    // so we mark it as found.
                    hasFoundValueFor[PROP] = true;
                }
            } else {
                if (i < LEN - 1) {
                    // We don't need that property, try next one.
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

    /**
     * Given a value, it returns all possible `animation-*` properties
     * to which we can apply the value. There might be properties that
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
    function getApplicableProperties (value : string) : string[] {
        // Check if the value is a <time> first.
        if (/^calc\(.+\)$/.test(value) || isTime(value)) {
            // animation-duration: 1s;
            // animation-duration: 100ms;
            // animation-duration: calc(0.1s * 20);
            return [ 'duration', 'delay' ];
        }
        
        // If not, check if it is a <number>.
        if (isNumberLiteral(value)) {
            // iteration-count: 10;
            return [ 'iteration-count' ];
        }

        // If not, check if it is a special function for `animation-timing-function`.
        if (/^cubic-bezier\(.+\)$/.test(value) || /^steps\(.+\)$/.test(value)) {
            return [ 'timing-function' ];
        }

        // If not, check if it is a special keyword for certain `animation-*` property.
        let type : string | null = mapTypeOfKeyword.get(value);
        if (typeof type === 'string') {
            if (isForbiddenWord(value)) {
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

    function isNumberLiteral (value : string) : boolean {
        return !Number.isNaN(Number(value));
    }

    function isForbiddenWord (value : string) : boolean {
        return value === 'none' || value === 'initial' || value === 'inherit' || value === 'unset';
    }

    // Determine if a value is a <time>, e.g. 250ms, 0.13e4ms, 1.5s.
    function isTime (value : string) : boolean {
        if (value.length > 2 && value.endsWith('ms')) {
            return isNumberLiteral(value.slice(0, value.length - 2));
        }

        if (value.length > 1 && value.endsWith('s')) {
            return isNumberLiteral(value.slice(0, value.length - 1))
        }

        return false;
    }
}

function assembleSelectorsAndRules(ruleSet : Rule[]) {
    const joinSplitedRule = ({ selectorGroup, declarationBlock }) => selectorGroup + ' ' + declarationBlock;
    return ruleSet.map(joinSplitedRule).join('\n');
}
