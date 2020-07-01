import {
    Rule,
    OtherPropertyDeclaration,
    AnimationNameDeclaration,
    AnimationDeclaration,
    AnimationProperty,
    ConditionalAtRule,
    CSSRule,
    KeyframeAtRule
} from "./Rule";
import { hasOwnProperty } from "../utils";

export class CSSRuleSetStringSerializer {
    public serialize (ruleSet : Rule[]) : string {
        let strRules = ruleSet.map(rule => {
            if (rule.type === 'cssRule') {
                return this.serializeCssRule(rule);
            } else if (rule.type === '@keyframes') {
                return this.serializeKeyframeAtRule(rule);
            } else {
                // @meida & @support
                return this.serializeConditionalAtRule(rule);
            }
        });

        return strRules.join('\n');
    }

    private serializeCssRule (rule : CSSRule) : string {
        let strSelectors = rule.selectors;
        let strDeclrs = rule.decalrations.map(declr => {
            if (declr.type === 'other') {
                return this.serializeOtherPropDeclr(declr);
            } else if (declr.type === 'animation') {
                return this.serializeAnimationDeclr(declr);
            } else {
                return this.serializeAnimationNameDeclr(declr);
            }
        });

        return `${strSelectors.join(',')}{${strDeclrs.join(';')}}\n`;
    }

    private serializeOtherPropDeclr (declr : OtherPropertyDeclaration) {
        return `${declr.property}:${declr.value};`;
    }

    private serializeAnimationNameDeclr (declr : AnimationNameDeclaration) {
        return `animation-name:${declr.value};`
    }

    private serializeAnimationDeclr (declr : AnimationDeclaration) {
        let propList : AnimationProperty[] = [
            'duration',
            'timing-function',
            'delay',
            'iteration-count',
            'direction',
            'fill-mode',
            'play-state',
            'name'
        ];

        let valueList = [];

        for (var prop of propList) {
            if (hasOwnProperty(declr.value, prop)) {
                valueList.push(declr.value[prop]);
            }
        }

        return `animation:${valueList.join(' ')}`;
    }

    private serializeKeyframeAtRule (keyframe : KeyframeAtRule) {
        return `@keyframes ${keyframe.name} ${keyframe.decalration}\n`;
    }

    private serializeConditionalAtRule (atRule : ConditionalAtRule) {
        return `${atRule.type} ${atRule.conditions} { ${this.serialize(atRule.rules)} }`;
    }
}