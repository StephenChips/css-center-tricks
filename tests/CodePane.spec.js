import CodePane from '../src/CodePane';
import { tick } from './test-utils';
import prettier from 'prettier';

jest.mock('highlight.js');

const CODEPANE_WITH_TWO_EXAMPLES = `
<div id="codepane" class="codepane">
    <div class="codepane__example" data-key="A">
        <div class="codepane__result"></div>
        <div class="codepane__code"></div>
    </div>
    <div class="codepane__example" data-key="B">
        <div class="codepane__result"></div>
        <div class="codepane__code"></div>
    </div>
</div>
`;

const CODEPANE_WITH_NO_EXAMPLES = `<div id="codepane" class="codepane"></div>`;

function initElement (template) {
    document.body.innerHTML = template;
    return document.getElementById('codepane');
}

describe('CodePane', () => {
    let el;
    let codepane;

    describe('Test switching examples, codes and results.', () => {
        let firstExample, secondExample;
        let firstCode, firstResult;
        let secondCode, secondResult;

        beforeEach(() => {
            el = initElement(CODEPANE_WITH_TWO_EXAMPLES);
            firstExample = el.children[0];
            secondExample = el.children[1];
            firstCode = firstExample.querySelector('.codepane__code');
            firstResult = firstExample.querySelectorAll('.codepane__result');
            secondCode = secondExample.querySelector('.codepane__code');
            secondResult = secondExample.querySelector('.codepane__result');
            codepane = new CodePane(el);
        });

        it('initialize', () => {
            expect(firstExample.classList.contains('actived')).toBe(true);
            expect(secondExample.classList.contains('actived')).toBe(false);
        });
    
        it('shows the first example again after creation', () => {
            codepane.showExample('A');
            expect(firstExample.classList.contains('actived')).toBe(true);
            expect(secondExample.classList.contains('actived')).toBe(false)
        });
    
        it('switch to another example after codepane is created', () => {
            codepane.showExample('B');
            expect(firstExample.classList.contains('actived')).toBe(false);
            expect(secondExample.classList.contains('actived')).toBe(true);
            expect(secondCode.classList.contains('actived')).toBe(true);
            expect(secondResult.classList.contains('actived')).toBe(false);
        });
    
        it('throws errors if the example to show does not exists.', () => {
            expect(() => {
                codepane.showExample('C');
            }).toThrow('The pane does not exists');
        });
    
        it('new CodePane(el) -> showResult()', () => {
            codepane.showResult();
            expect(secondCode.classList.contains('actived')).toBe(false);
            expect(secondResult.classList.contains('actived')).toBe(false)
        });
    });
    describe('Test adding example', () => {
        beforeEach(() => {
            el = initElement(CODEPANE_WITH_NO_EXAMPLES);
            codepane = new CodePane(el);
        });

        it('Can add example', async () => {
            codepane.addExample('flexbox', {
                html: `
                    <div class="flexbox">
                        <div class="flexbox-inner">hello, world</div>
                    </div>
                `,
                css: {
                    '.flexbox': {
                        'display': 'flex'
                    },
                    '.flexbox-inner': {
                        'flex-basis': '200px',
                    }
                }
            });
    
            await tick();
    
            codepane.showExample('flexbox');

            const elExample = document.querySelector('.codepane__example[data-key="flexbox"]');
            expect(elExample).not.toBeNull();

            const elResult = elExample.querySelector('.codepane__result'); 
            const elStyle = elExample.querySelector('.codepane__code .codepane__css code');
            const elHTML = elExample.querySelector('.codepane__code .codepane__html code');

            codepane.showCode();
            await tick();

            expect(elStyle.textContent).toBe(
`.flexbox {
    display: flex;
}
.flexbox-inner {
    flex-basis: 200px;
}`
            );

            expect(elHTML.textContent).toBe(
`<div class="flexbox">
    <div class="flexbox-inner">hello, world</div>
</div>`
            );

            const formattedResult = prettier.format(elResult.innerHTML, {
                tabWidth: 4,
                parser: 'html'
            });

            expect(formattedResult).toBe(
`<div class="flexbox">
    <div class="flexbox-inner">hello, world</div>
</div>
`
            );

            codepane.showResult();
            await tick();

            const elFlexbox = elResult.querySelector('.flexbox');
            const elFlexboxInner = elResult.querySelector('.flexbox-inner');

            expect(getComputedStyle(elFlexbox).flex).toBe('flex');
            expect(getComputedStyle(elFlexboxInner).flexBasis).toBe('200px');
        });
    });
});
