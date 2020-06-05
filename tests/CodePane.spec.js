import CodePane from '../src/CodePane';
import { tick } from './test-utils';

jest.mock('highlight.js');

/**
 * There are three aspect for testing a component:
 * 1. Behaviour
 * 2. Element structure
 * 3. Style
 * 
 * For testing component's behaviour, you can alter initialize your component, control the input and check for output.
 * Input is things will make the component changed, and an output. is a things that is effected by the component's change. 
 * 
 * Common inputs include:
 *    1. calling component's method.
 *    2. setting component's property/data.
 *    3. triggering a DOM event
 * 
 * Common outputs include:
 *    1. DOM structure's change
 *    2. component's property/data's change
 *    3. recieving a event and calling the callback.
 * 
 * Inputs and output may be various, many of them are actually the same, but are treated differently. 
 * You should analyze and find them out before writing a test.
 * 
 * 2. For testing component's element structure, you can use Jest's snapshot testing. you can set to component to a certain state first, then take a snapshot.
 * 
 * 3. For testing component's style,  you can do the similiar thing as testing behaviour.
 *    You can observe the style changes by calling getComputedStyle(...) method.
 */

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

describe('CodePane', () => {
    let el;
    let codepane;

    function createCodePane (template) {
        document.body.innerHTML = template;
        el = document.getElementById('codepane');
        return new CodePane(el);
    }

    describe('Test initialization, showExample, showCode and showResult', () => {
        let firstExample, secondExample;
        let firstCode, firstResult;
        let secondCode, secondResult;

        function setupElements () {
            firstExample = el.children[0];
            secondExample = el.children[1];
            firstCode = firstExample.querySelector('.codepane__code');
            firstResult = firstExample.querySelector('.codepane__result');
            secondCode = secondExample.querySelector('.codepane__code');
            secondResult = secondExample.querySelector('.codepane__result');
        }

        it('will shows the first example by default', () => {
            codepane = createCodePane(CODEPANE_WITH_TWO_EXAMPLES);

            setupElements();

            expect(firstExample.classList.contains('actived')).toBe(true);
            expect(secondExample.classList.contains('actived')).toBe(false);
        });
    
        it('re-show the same example won\'t make any changes', () => {
            codepane = createCodePane(CODEPANE_WITH_TWO_EXAMPLES);

            setupElements();

            codepane.showExample('A');
            expect(firstExample.classList.contains('actived')).toBe(true);
            expect(secondExample.classList.contains('actived')).toBe(false)
        });
    
        it('showExample(\'B\')', () => {
            codepane = createCodePane(CODEPANE_WITH_TWO_EXAMPLES);

            codepane.showExample('B');

            setupElements();
    
            expect(firstExample.classList.contains('actived')).toBe(false);
            expect(secondExample.classList.contains('actived')).toBe(true);
            expect(secondCode.classList.contains('actived')).toBe(true);
            expect(secondResult.classList.contains('actived')).toBe(false);
        });
    
        it('throws errors if the example to show does not exists.', () => {
            expect(() => {
                codepane = createCodePane(CODEPANE_WITH_TWO_EXAMPLES);
                codepane.showExample('C');
            }).toThrow('The pane does not exists');
        });
    
        it('new CodePane(el) -> showResult()', () => {
            codepane = createCodePane(CODEPANE_WITH_TWO_EXAMPLES);
            codepane.showResult();

            setupElements();

            expect(secondCode.classList.contains('actived')).toBe(false);
            expect(secondResult.classList.contains('actived')).toBe(false)
        });

        // If the code's behaviour doesn't meet the requirement,
        // Even all paths are covered, there are still bugs.
        it('If a CodePane is displaying the result HTML, when we switch to another example, it will display that example\'s result HTML.', async () => {
            codepane = createCodePane(CODEPANE_WITH_TWO_EXAMPLES);
            codepane.showExample('B');
            codepane.showResult();
            await tick();
            codepane.showExample('A');

            setupElements();

            expect(firstResult.classList.contains('actived')).toBe(true);
            expect(firstCode.classList.contains('actived')).toBe(false);
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

        it('will create example\'s element with a correct key and append it to the document.', () => {
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

        it('the new example shows its code after creation (in its \'showing-code\' state)', () => {
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

            const elCode = document.querySelector('.codepane__example[data-key="flexbox"] .codepane__code');
            const elResult = document.querySelector('.codepane__example[data-key="flexbox"] .codepane__result');
            expect(elCode.classList.contains('actived')).toBe(true);
            expect(elResult.classList.contains('actived')).toBe(false);
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
    });
});
