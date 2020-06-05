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

function createCodePane (template) {
    document.body.innerHTML = template;
    let el = document.getElementById('codepane');
    return new CodePane(el);
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

    describe('Test addExample(...)', () => {
        let sampleHTML = `
            <div class="flexbox">
                <div class="flexbox-inner">hello, world</div>
            </div>
        `;

        it('The new example will not become actived after we call "addExample(...)".', async () => {
            let codepane = createCodePane(CODEPANE_WITH_NO_EXAMPLES);
            codepane.addExample('flexbox', {
                html: sampleHTML,
                css: {
                    '.flexbox': {
                        'display': 'flex'
                    }
                },
            });

            await tick();

            // Since there aren't any examples before, certainly there aren't any actived example before we call "addExample(...)".
            // And since `codePane` won't automatically make an example actived, no example should be actived after the call.
            expect(document.querySelector('.codepane__example.actived')).toBeNull();

            // You have to call "showExample(...)" manually to make the new example actived.
            codepane.showExample('flexbox');
            expect(document.querySelector('.codepane__example.actived')).not.toBeNull();
        });

        it('will create and add example to the DOM', () => {
            let codepane = createCodePane(CODEPANE_WITH_NO_EXAMPLES);
            codepane.addExample('flexbox', {
                html: sampleHTML,
                css: {
                    '.flexbox': {
                        'display': 'flex'
                    },
                    '.flexbox-inner': {
                        'flex-basis': '200px',
                    }
                }
            });

            const elExample = document.querySelector('.codepane__example[data-key="flexbox"]');
            expect(elExample).not.toBeNull();
        });

        it('will apply correct style to the result HTML according to the given CSS object.', () => {
            let codepane = createCodePane(CODEPANE_WITH_NO_EXAMPLES);
            codepane.addExample('flexbox', {
                // This is the HTML that will be rendered when we call "codePane.showResult()"
                // also, a character-escaped version will be created and will be displayed when we call "codePane.showCode()"
                html: sampleHTML,

                // This is a CSS object, which will be converted to real CSS and appied to the result HTML.
                css: {
                    // Each key of the parent object is a selector
                    '.flexbox': {
                        // And the child object specified acutal style rules for the element that is going to bew chosen by the selector.
                        'display': 'flex'
                    },
                    '.flexbox-inner': {
                        'flex-basis': '200px',
                    }
                }
            });

            const elExample = document.querySelector('.codepane__example[data-key="flexbox"]');
            const elFlexbox = elExample.querySelector('.codepane__result .flexbox');
            const elFlexboxInner = elExample.querySelector('.codepane__result .flexbox-inner');

            expect(getComputedStyle(elFlexbox).display).toBe('flex');
            expect(getComputedStyle(elFlexboxInner).flexBasis).toBe('200px');
        });

        it('cannot add two example with same key', async () => {
            expect(async () => {
                codePane.addExample(sampleHTML, { '.flexbox': { 'display': 'flex' } });
                await tick();
                codePane.addExample(sampleHTML, { '.flexbox': { 'display': 'flex' } });
                await tick();
            }).rejects.toThrow();
        });

        it('render result correctly when we call "showResult()"', () => {
            let codePane = createCodePane(CODEPANE_WITH_NO_EXAMPLES);
            codePane.addExample('flexbox', {
                html: sampleHTML,
                css: {
                    '.flexbox': {
                        'display': 'flex'
                    },
                    '.flexbox-inner': {
                        'flex-basis': '200px'
                    }
                }
            });

            codePane.showExample('flexbox');
            codePane.showResult();

            expect(codePane.el).toMatchSnapshot();
        });

        it('render HTML & CSS snippets correctly when we call "showCode()"', () => {
            let codePane = createCodePane(CODEPANE_WITH_NO_EXAMPLES);
            codePane.addExample('flexbox', {
                html: sampleHTML,
                css: {
                    '.flexbox': {
                        'display': 'flex'
                    },
                    '.flexbox-inner': {
                        'flex-basis': '200px'
                    }
                }
            });

            codePane.showExample('flexbox');
            codePane.showCode();

            expect(codePane.el).toMatchSnapshot();
        });

        console.warn(
            "[Notice CodePane.spec.js] Still, you are responsible to test following visual effects \n" +
            "   1. CodePane should show split view correctly, \n" +
            "   2. CodePane should highlight the code (both CSS and HTML snippets) correctly. \n" +
            "   3. CodePane should should the result HTML correctly.\n"
        );
    });
});
