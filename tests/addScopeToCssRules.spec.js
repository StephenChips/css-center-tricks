import { addScopeToCssRules } from "../src/addScopeToCssRules";

// The scope to be added to the rules is ".dummy"

describe('addScopeToCssRules.js', () => {
    // Test empty/blank string
    it('input: empty string', () => {
        let scoped = addScopeToCssRules('dummy', '');
        expect(scoped).toBe('');
    });

    it('input: string with only spaces and blanks', () => {
        let scoped = addScopeToCssRules('dummy', '    \n\n\r\n   ');
        expect(scoped).toBe('');
    });

    it('input: two rules, has an At-Rule, has spaces and blanks', () => {
        let rules =
`@keyframe fakeout {
    from {
        width: 0;
    }

    to {
        width: 100%;
    }
}

div {
    display: flex;
}

`
;

        let expected =
`@keyframe fakeout-dummy {
    from {
        width: 0;
    }

    to {
        width: 100%;
    }
}
[data-dummy] div {
    display: flex;
}`;
        let scoped = addScopeToCssRules('dummy', rules);
        expect(scoped).toBe(expected);
    });

    it('input: one rule, with multiple selector, has spaces and blanks', () => {
        let rules = 
`a.banner-body, a.banner-header,
 a.banner-footer {
    text-decoration: none;
    color: blue;
}`;

        let expected = 
`[data-dummy] a.banner,
[data-dummy] a.banner-header,
[data-dummy] a.banner-footer {
    text-decroation
}`;

        let scoped = addScopeToCssRules('dummy', rules);
        expect(scoped).toBe(expected);
    });
});                                                                                                         