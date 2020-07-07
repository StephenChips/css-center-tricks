import { addScopeToCssRules } from "../src/addScopeToCSSRules";

// 1. There will be an carriage at the end of string.
// 2. At-Rules' content will remain the same.
// 3. CSS Rule will be compressed. all blanks will be deleted.
// 4. A carriage is inserted between two rules.
//
// Why only some parts are compressed?
// Mainly because the compressed parts are the part that needs to be modifed.
// In contract, the uncompressed parts are the part that we don not care about.
// We will only parse the parts that would need to be modified into JavaScript
// objects and arrays, and remains those about which we don't care as string.
// And since the parser will not record blanks, when we transform them back to
// string, all blanks will be loss, and therefore, they are compressed.

describe('addScopeToCssRules.js', () => {
    // Test empty/blank string
    it('Entering Empty string will output nothing', () => {
        let scoped = addScopeToCssRules('dummy', '');
        expect(scoped).toBe('');
    });

    it('Entering Blank string will output nothing', () => {
        expect(addScopeToCssRules('dummy', ' \n\r\v\f\t')).toBe('');
    });
    
    it('@media and @supports At-Rules are supported', () => {
        let scoped = addScopeToCssRules('dummy', `
@media (max-width: 1280px) and (min-width: 980px) {
    a.banner-body {
        text-decoration: none;
    }
}
@supports (display: flex) {
    a.banner-body {
        display: flex;
    }
}
`);

        expect(scoped).toBe(
`@media (max-width: 1280px) and (min-width: 980px) {
[data-dummy] a.banner-body{text-decoration:none;}
}
@supports (display: flex) {
[data-dummy] a.banner-body{display:flex;}
}
`
        );
    });

    describe('Property Animation, Animation-Name as well as @keyframes', () => {
        it('All animation names will be updated, even those are not defined.', () => {
            let scoped = addScopeToCssRules('dummy', `
@keyframes fakeout {
    from {
        opacity: 1;
    }

    to {
        opacity: 0;
    }
}

@keyframes "fake out" {
    from {
        opacity: 1;
    }

    to {
        opacity: 0;
    }
}

div {
    animation: 3s fakeout;
}

p {
    animation: 3s "not defined";
}`
            );
    
            expect(scoped).toBe(
`@keyframes fakeout-dummy{
    from {
        opacity: 1;
    }

    to {
        opacity: 0;
    }
}
@keyframes "fake out dummy"{
    from {
        opacity: 1;
    }

    to {
        opacity: 0;
    }
}
[data-dummy] div{animation:3s fakeout-dummy;}
[data-dummy] p{animation:3s "not defined dummy";}
` 
            );
        });
    
        it('The number of values is either 2, 4 or 8', () => {
            let scoped = addScopeToCssRules(
`div {
    animation:
        1s fadein,
        1s linear 1s slidein,
        3s ease-in 1s 2 reverse both paused hue;
}`
            );

            expect(scoped).toBe('div{animation:is fadein,1s linear 1s slidein,3s ease-in 1s 2 reverse both paused hue;');
        });
    });

    describe('CSS rules without property Animation and Animation-Name', () => {
        it('One empty rule', () => {
            let scoped = addScopeToCssRules('dummy', `
a.banner-body {   }`
            );
            expect(scoped).toBe('[data-dummy] a.banner-body{}\n');
        });
        it('One rule, one property declaration', () => {
            let scoped = addScopeToCssRules('dummy', `
a.banner-body {
    text-decoration: none;
}`
            );
            expect(scoped).toBe('[data-dummy] a.banner-body{text-decoration:none;}\n');
        });

        it('One rule, two properties', () => {
            expect(addScopeToCssRules('dummy', `
a.banner-body {
    display: flex;
    border: 1px solid #afafaf;
}
            `)).toBe('[data-dummy] a.banner-body{display:flex;border:1px solid #afafaf;}\n');
        });

        it('Two rules, one property for each', () => {
            expect(addScopeToCssRules('dummy', `
a.banner-body {
    display: flex;
}
a.banner-footer {
    display: flex;
}
            `)).toBe(
`[data-dummy] a.banner-body{display:flex;}
[data-dummy] a.banner-footer{display:flex;}
`
            );
        });

        it('One rule with two selectors', () => {
            expect(addScopeToCssRules('dummy', `
a.banner-body, a.banner-footer {
    display: flex;
}
            `)).toBe(`[data-dummy] a.banner-body,[data-dummy] a.banner-footer{display:flex;}\n`)
        });
    });
});
