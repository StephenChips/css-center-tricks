import CodePane from '../src/CodePane';
import { tick } from './test-utils';

/**
 * There are three aspects for testing a component:
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
 * Inputs and output may be various, many of them are actually the same, but they should be treated differently. 
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

function createCodePane (template) {
    document.body.innerHTML = template;
    return new CodePane(document.getElementById('codepane'));
}

describe('Test initialization, showExample, showCode and showResult', () => {
    // We used the CodePane template with two examples for testing
    // (see above). For convenient, we declear following variables,
    // which will be assigned to correspondent HTML element
    // before each test starts.

    let firstExample; // it points to the first example's element.
    let secondExample; // it points to the second example's element.

    // it points to the first example's code snippet pane's element
    // (the one shows after calling "showCode(...)").
    let firstCode; 
    
    // it points to the first example's result pane's element
    // (the one shows after calling "showResult(...)").
    let firstResult;

    // it points to the first example's code snippet pane's element
    // (the one shows after calling "showCode(...)").
    let secondCode;

    // it points to the second example's result pane's element
    // (the one shows after calling "showResult(...)").
    let secondResult;

    let codepane; // the CodePane instance that we are going to test.
    let el; // HTML elements controled by testing CodePane.

    function setupElements () {
        // We assumes that the codepane has been initialized. and its element is accessible.
        el = codepane.el;
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
    // even all paths are covered, there are still bugs.
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
    const NEW_EXAMPLE_KEY = 'dummy';

    const html = '<div></div>'
    const css = `div { display: flex; }`;
    const scopedCss = `.codepane__example[data-example-key="${NEW_EXAMPLE_KEY}"] div { display: flex }`;
    const htmlSnippet = '&lt;div&gt;&lt;div/&gt;';
    const cssSnippet = [
        '<span class="selector">div</span>&nbsp;{',
        '    <span class="property-name">display</span>:&nbsp;<span class="property-value">flex</span>;',
        '}',
    ].join('<br/>');

    let codepane, el;

    async function createCodePaneAndAddOneExample () {
        codepane = createCodePane(CODEPANE_WITH_NO_EXAMPLES);
        codepane.addExample(NEW_EXAMPLE_KEY, {
            html,
            css,
            htmlSnippet,
            cssSnippet
        });

        await tick();

        el = codepane.el;
        return codepane;
    }
    
    it('render result correctly when we call "showResult()"', async () => {
        await createCodePaneAndAddOneExample();

        codepane.showExample(NEW_EXAMPLE_KEY);
        codepane.showResult();

        expect(codepane.el).toMatchSnapshot();
    });

    it('render HTML & CSS snippets correctly when we call "showCode()"', async () => {
        await createCodePaneAndAddOneExample();

        codepane.showExample(NEW_EXAMPLE_KEY);
        codepane.showCode();

        expect(codepane.el).toMatchSnapshot();
    });

    it('cannot add two example with same key', async () => {
        const addSameExampleTwice = async () => {
            codepane.addExample('SAME_KEY', {
                html,
                css,
                htmlSnippet,
                cssSnippet
            });

            await tick();
            codepane.addExample('SAME_KEY', {
                html,
                css,
                htmlSnippet,
                cssSnippet
            });

            await tick();
        };

        await expect(addSameExampleTwice()).rejects.toBeInstanceOf(Error);
    });
    
    it('will create example\'s element with the correct key and append it to CodePane.', async () => {
        await createCodePaneAndAddOneExample();
        const elExample = el.querySelector(`.codepane__example[data-key="${NEW_EXAMPLE_KEY}"]`);
        expect(elExample).not.toBeNull();
    });

    it('The new example will not automatically become actived until we call "addExample(...)".', async () => {
        await createCodePaneAndAddOneExample();

        // First, we select the example's element here. It should not be actived by default.
        // expect(...).toBeNull() means we cannot find the actived example.
        expect(el.querySelector(`.codepane__example[data-key="${NEW_EXAMPLE_KEY}"].actived`)).toBeNull(); 

        // Until we call "showExample(...)".
        codepane.showExample(NEW_EXAMPLE_KEY);
        // expect(...).not.toBeNull() means we found the actived example.
        expect(el.querySelector(`.codepane__example[data-key="${NEW_EXAMPLE_KEY}"].actived`)).not.toBeNull(); 
    });

    it('the new example shows code snippets if CodePane\'s current state is \'showing-code\'', async () => {
        let codepane = createCodePane(CODEPANE_WITH_NO_EXAMPLES);

        codepane.showCode();

        await tick();
    
        codepane.addExample('EXAMPLE_ONE', {
            html,
            css,
            htmlSnippet,
            cssSnippet
        });

        await tick();

        const elCode = codepane.el.querySelector(`.codepane__example[data-key="EXAMPLE_ONE"] .codepane__code`);
        const elResult = codepane.el.querySelector(`.codepane__example[data-key="EXAMPLE_ONE"] .codepane__result`);
        expect(elCode.classList.contains('actived')).toBe(true);
        expect(elResult.classList.contains('actived')).toBe(false);
    });

    it('the new example shows the result HTML if CodePane\'s current state is \'showing-result\'', async () => {
        let codepane = createCodePane(CODEPANE_WITH_NO_EXAMPLES);

        codepane.showResult();

        await tick();
    
        codepane.addExample('EXAMPLE_ONE', {
            html,
            css,
            htmlSnippet,
            cssSnippet
        });

        await tick();

        const elCode = codepane.el.querySelector(`.codepane__example[data-key="EXAMPLE_ONE"] .codepane__code`);
        const elResult = codepane.el.querySelector(`.codepane__example[data-key="EXAMPLE_ONE"] .codepane__result`);
        expect(elCode.classList.contains('actived')).toBe(false);
        expect(elResult.classList.contains('actived')).toBe(true);
    });

    // [FAIL] Bacause we doesn't add name to the style tag
    it('will add a <style> tag in the <head> element', async () => {
        await createCodePaneAndAddOneExample();

        let styleTag = document.querySelector(`head > style[data-codepane-example-key="${NEW_EXAMPLE_KEY}"]`);
        expect(styleTag).toBeInstanceOf(HTMLStyleElement);

        // the style rules' selector will be scoped so that it can only effect elements inside a specific example.
        expect(styleTag.textContent).toBe(scopedCss);
    });
});
