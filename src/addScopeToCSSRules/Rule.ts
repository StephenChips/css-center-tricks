/**
 * The type of the parser's output.
 */
export type Rule = CSSRule | KeyframeAtRule | ConditionalAtRule;

export type AnimationProperty = 
    'name' |
    'duration' |
    'timing-function' |
    'delay' |
    'iteration' |
    'iteration-count' |
    'direction' |
    'fill-mode' |
    'play-state';

/**
 * This type stands for a decalration for any CSS property apart from
 * `animation` and `animation-name`. The value will remain as string,
 * since we do not care about it.
 */
export type OtherPropertyDeclaration = {
    type: 'other',
    property: string,
    value: string
};

export type AnimationNameDeclaration = {
    type: 'animation-name',
    property: 'animation-name', 
    value: string
};

/**
 * We do care about how the property animation's value is,
 * so we further parse them into an object of `animation-*`
 * proeprties. For simplicity, the prefix 'animation-' is
 * omitted.
 */
export type AnimationDeclaration = {
    type: 'animation',
    property : 'animation',
    value: AnimationValue[];
};

export type Declaration = AnimationDeclaration | AnimationNameDeclaration | OtherPropertyDeclaration;

type TwoValuesAnimationValue = {
    name: string,
    duration: string;
};

type FourValuesAnimationValue = {
    name: string,
    duration: string,
    'timing-function': string,
    delay: string
};

type EightValuesAnimationValue = {
    'name': string,
    'duration': string,
    'timing-function': string,
    'delay': string,
    'iteration': string,
    'iteration-count': string,
    'direction': string,
    'fill-mode': string
    'play-state': string
}

export type AnimationValue = TwoValuesAnimationValue | FourValuesAnimationValue | EightValuesAnimationValue;

/**
 * This type stands for a common CSS style rule. The rule that declares CSS
 * properties and values.
 */
export type CSSRule = {
    type: 'cssRule',
    selectors: string[],
    decalrations: Declaration[]
};

/** 
 * This type stands for the '@keyframes' At-Rule. The content of a @keyframes,
 * a.k.a decalaration, is not parsed. It remains as string.
 */
export type KeyframeAtRule = {
    type: '@keyframes',
    name: string,
    decalration: string;
};

/**
 * This type stands for the '@media' and '@supports' At-Rules.
 */
export type ConditionalAtRule = {
    type: '@media' | '@supports',
    conditions: string,
    rules: Rule[]
};
