import { CSSRuleSetParser } from './CSSRuleSetParser.js';
import { CSSRuleSetStringSerializer } from './CSSRuleSetStringSerializer';
import { Rule } from './Rule';

/**
By adding a scope, we limit the effective range of each CSS rule,
prevent it from effect some irrelative css rules that causes some
quirky style problem.

Technically. We add a class in front of every selectors, change
every animation-name, animation properties' value, and update
every keyframes' name.

 */
export function addScopeToCssRules (scope : string, css : string) {
    let parser = new CSSRuleSetParser(css);
    let serializer = new CSSRuleSetStringSerializer();
    let ruleSet : Rule[] = parser.parse();

    addScope(scope, ruleSet);

    return serializer.serialize(ruleSet);

    function addScope (scope : string, ruleSet : Rule[]) : void {
        for (let rule of ruleSet) {
            if (rule.type === 'cssRule') {
                // Update the selectors
                for (var i = 0; i < rule.selectors.length; i++) {
                    rule.selectors[i] = `[data-${scope}] ${rule.selectors[i]}`
                }

                // Check the property decalrations, if there are any 'animation'
                // and 'animation-name' declarations, add scope to thme.
                for (let declr of rule.decalrations) {
                    if (declr.type === 'animation') {
                        declr.value.name = addScopeToAnimationName(scope, declr.value.name);
                    } else if (declr.type === 'animation-name') {
                        declr.value = addScopeToAnimationName(scope, declr.value);
                    }
                }
            } else if (rule.type === '@keyframes') {
                rule.name = addScopeToAnimationName(scope, rule.name);
            } else {
                // '@media' && '@support'
                addScope(scope, rule.rules);
            }
        }
    }

    function addScopeToAnimationName (scope : string, name : string) : string {
        if (name.endsWith("\'") || name.endsWith('\"')) {
            let content = name.slice(1, name.length - 1); // remove the quote
            let quote = name.charAt(0);
            return quote + content + ' ' + scope + quote;
        } else {
            return name + '-' + scope;
        }
    }
}
