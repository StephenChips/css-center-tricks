import Menu from '../src/Menu';
import { tick } from './test-utils';

const FIRST_ITEM_IS_ACTIVED = `
<ul id="menu" class="menu">
    <li data-key="A" class="menu__item actived"><a href="javascript:void(0);">first</a></li>
    <li data-key="B" class="menu__item"><a href="javascript:void(0);">second</a></li>
    <li data-key="C" class="menu__item"><a href="javascript:void(0);">thrird</a></li>
</ul>
`;

const MULTIPLE_ITEM_ARE_ACTIVED = `
<ul id="menu" class="menu">
    <li data-key="A" class="menu__item actived"><a href="javascript:void(0);">first</a></li>
    <li data-key="B" class="menu__item actived"><a href="javascript:void(0);">second</a></li>
    <li data-key="C" class="menu__item"><a href="javascript:void(0);">thrird</a></li>
</ul>
`;

const NONE_OF_ITEMS_ARE_ACTIVED = `
<ul id="menu" class="menu">
    <li data-key="A" class="menu__item"><a href="javascript:void(0);">first</a></li>
    <li data-key="B" class="menu__item"><a href="javascript:void(0);">second</a></li>
    <li data-key="C" class="menu__item"><a href="javascript:void(0);">thrird</a></li>
</ul>
`;

const NO_ITEM = `
<ul id="menu" class="menu"></ul>
`;

const DUPLICATED_KEY = `
<ul id="menu" class="menu">
    <li data-key="A" class="menu__item"><a href="javascript:void(0);">first</a></li>
    <li data-key="A" class="menu__item"><a href="javascript:void(0);">second</a></li>
    <li data-key="C" class="menu__item"><a href="javascript:void(0);">thrird</a></li>
</ul>
`;

const NO_KEY = `
<ul id="menu" class="menu">
    <li class="menu__item"><a href="javascript:void(0);">first</a></li>
    <li class="menu__item"><a href="javascript:void(0);">second</a></li>
    <li class="menu__item"><a href="javascript:void(0);">thrird</a></li>
</ul>
`;


describe('Menu', () => {
    let el;

    function createMenuFromTemplate (template, opts = {}) {
        const defaultOpts = {
            createMenuItemElement: () => `
                <li><a href="javascript:void(0);"></a></li>
            `,
            rootClass: 'menu',
            itemClass: 'menu__item',
            activedClass: 'actived'
        };
    
        document.body.innerHTML = template;
        el = document.querySelector('#menu');
    
        return new Menu(el, Object.assign({}, defaultOpts, opts));
    }

    function parseTemplate (template) {
        document.body.innerHTML = template;
        return document.querySelector('#menu');
    }

    describe('Initialization with DOM element', () => {
        // If there is only one menu item is actived (contains 'actived class'), it will stay active as it is.
        it('Normal situation: there is only one actived item.', () => {
            // create menu with default options
            let menu = createMenuFromTemplate(FIRST_ITEM_IS_ACTIVED);
            
            let menuItems = menu.el.querySelectorAll('.menu > .menu__item');
            expect(menuItems[0].classList.contains('actived')).toBe(true);
            expect(menuItems[1].classList.contains('actived')).toBe(false);
            expect(menuItems[2].classList.contains('actived')).toBe(false);
        });

        // No items will be set actived automatically.
        it('Normal situation: there are no actived items. ', () => {
            let menu = createMenuFromTemplate(NONE_OF_ITEMS_ARE_ACTIVED);

            let menuItems = menu.el.querySelectorAll('.menu > .menu__item');
            expect(menuItems[0].classList.contains('actived')).toBe(false);
            expect(menuItems[1].classList.contains('actived')).toBe(false);
            expect(menuItems[2].classList.contains('actived')).toBe(false);
        });
        

        // Having multiple item actived at the same time is not valid. The items will be reset, and only the first one of them will become active.
        it('Invalid situation: there are more than one actived item.', () => {
            expect(() => {
                createMenuFromTemplate(MULTIPLE_ITEM_ARE_ACTIVED);
            }).toThrow('Only one item can be actived at a time.');
        });

        it('Invalid situation: there are some items have dupliicated key.', () => {
            expect(() => {
                createMenuFromTemplate(DUPLICATED_KEY);
            }).toThrow('There are some items\' key that are duplicated.');
        });

        it('Invalid situation: there are some items have no key.', () => {
            expect(() => {
                createMenuFromTemplate(NO_KEY);
            }).toThrow('There are some items have no key.');
        });

        it('Invalid situation: missing the option when creating menu', () => {
            expect(() => {
                new Menu(parseTemplate(NO_ITEM))
            }).toThrow('missed the option');
        });

        it('Invalid situation: missing the `createMenuItemElement` function in the option.', () => {
            expect(() => { 
                new Menu(parseTemplate(NO_ITEM), {
                    rootClass: 'menu',
                    itemClass: 'menu__item',
                    activedClass: 'actived'
                });
            }).toThrow('missed the function createMenuItemElement');
        });

        it('Invalid situation: missing the rootClass in the option', () => {
            expect(() => { 
                new Menu(parseTemplate(NO_ITEM), {
                    createMenuItemElement: () => `
                        <li><a href="javascript:void(0);"></a></li>
                    `,
                    itemClass: 'menu__item',
                    activedClass: 'actived'
                });
            }).toThrow('missing the rootClass in the option');
        });

        it('Invalid situation: missing the itemClass in the option', () => {
            expect(() => { 
                new Menu(parseTemplate(NO_ITEM), {
                    createMenuItemElement: () => `
                        <li><a href="javascript:void(0);"></a></li>
                    `,
                    rootClass: 'menu',
                    activedClass: 'actived'
                });
            }).toThrow('missing the itemClass in the option');
        });

        it('Invalid situation: missing the activedClass in the option', () => {
            expect(() => { 
                new Menu(parseTemplate(NO_ITEM), {
                    createMenuItemElement: () => `
                        <li><a href="javascript:void(0);"></a></li>
                    `,
                    rootClass: 'menu',
                    itemClass: 'menu__item'
                });
            }).toThrow('missing the activedClass in the option');
        });
    });

    describe('Clicking and event emitting', () => {
        it('[none] -> [1st item]', async () => {
            // create menu with default options.
            let menu = createMenuFromTemplate(NONE_OF_ITEMS_ARE_ACTIVED);
            let menuItems = menu.el.querySelectorAll('.menu > .menu__item');
            let mockCallback = jest.fn();

            menu.on('active', mockCallback);
            menuItems[0].dispatchEvent(new Event('click'));
            await tick();

            expect(mockCallback).lastCalledWith(expect.objectContaining({
                key: 'A',
                oldKey: null
            }));

            expect(menuItems[0].classList.contains('actived')).toBe(true);
            expect(menuItems[1].classList.contains('actived')).toBe(false);
            expect(menuItems[2].classList.contains('actived')).toBe(false);
        });

        it('[1st item] -> [2nd item]', async () => {
            // create menu with default options.
            let menu = createMenuFromTemplate(FIRST_ITEM_IS_ACTIVED);
            let menuItems = menu.el.querySelectorAll('.menu > .menu__item');
            let mockCallback = jest.fn();

            menu.on('active', mockCallback);
            menuItems[1].dispatchEvent(new Event('click'));
            await tick();

            expect(mockCallback).lastCalledWith(expect.objectContaining({
                key: 'B',
                oldKey: 'A'
            }));

            expect(menuItems[0].classList.contains('actived')).toBe(false);
            expect(menuItems[1].classList.contains('actived')).toBe(true);
            expect(menuItems[2].classList.contains('actived')).toBe(false);
        });

        it('[1st item] -> [1st item]', async () => {
            // create menu with default options.
            let menu = createMenuFromTemplate(FIRST_ITEM_IS_ACTIVED);
            let menuItems = menu.el.querySelectorAll('.menu > .menu__item');
            let mockCallback = jest.fn();

            menu.on('active', mockCallback);
            menuItems[0].dispatchEvent(new Event('click'));
            await tick();

            expect(mockCallback).lastCalledWith(expect.objectContaining({
                key: 'A',
                oldKey: 'A'
            }));

            expect(menuItems[0].classList.contains('actived')).toBe(true);
            expect(menuItems[1].classList.contains('actived')).toBe(false);
            expect(menuItems[2].classList.contains('actived')).toBe(false);
        });

        it('[1st item] -> [2nd item] -> [3rd item]', async () => {
            // create menu with default options.
            let menu = createMenuFromTemplate(FIRST_ITEM_IS_ACTIVED);
            let menuItems = menu.el.querySelectorAll('.menu > .menu__item');
            let mockCallback = jest.fn();


            menu.on('active', mockCallback);
            menuItems[1].dispatchEvent(new Event('click'));
            await tick();

            expect(mockCallback).lastCalledWith(expect.objectContaining({
                key: 'B',
                oldKey: 'A'
            }));
    
            expect(menuItems[0].classList.contains('actived')).toBe(false);
            expect(menuItems[1].classList.contains('actived')).toBe(true);
            expect(menuItems[2].classList.contains('actived')).toBe(false);

            menuItems[2].dispatchEvent(new Event('click'));
            await tick();

            expect(mockCallback).lastCalledWith(expect.objectContaining({
                key: 'C',
                oldKey: 'B'
            }));
            expect(menuItems[0].classList.contains('actived')).toBe(false);
            expect(menuItems[1].classList.contains('actived')).toBe(false);
            expect(menuItems[2].classList.contains('actived')).toBe(true);
        });
    });

    describe('function createMenuItemElement', () => {
        let el;

        it('Normal case #1: function that returns a string that represents a valid element', () => {
            // create menu with customized `createMenuItemElement` function.
            let createMenuItemElement = jest.fn(() => `<li></li>`);
            let menu = createMenuFromTemplate(NO_ITEM, {
                createMenuItemElement
            });

            menu.setItems([
                { key: 'A' },
            ]);
            expect(menu.el.querySelectorAll('.menu > .menu__item').length).toBe(1);
        });

        it('Normal case #2: function that returns an element', () => {
            // create menu with customized `createMenuItemElement` function.
            let createMenuItemElement = jest.fn(() => document.createElement('li'));
            let menu = createMenuFromTemplate(NO_ITEM, {
                createMenuItemElement
            });

            menu.setItems([
                { key: 'A' },
            ]);

            expect(createMenuItemElement).toHaveBeenCalledTimes(1);
            expect(menu.el.querySelectorAll('.menu > .menu__item').length).toBe(1);
        });

        test.each([
            'blahblahblah',
            '<li><a></li>',
            ''
        ])('Invalid case: function returns invalid string "%s"', str => {
            expect(() => {
                // create menu with customized `createMenuItemElement` function.
                let createMenuItemElement = jest.fn(() => str);
                let menu = createMenuFromTemplate(NO_ITEM, {
                    createMenuItemElement
                });

                menu.setItems([
                    { key: 'A' },
                ]);
            }).toThrow('The string returned from your "createMenuItemElement(...)" function doesn\'t represents a valid HTML.');
        });

        it('Invalid case: function returns string that contains more than one element', () => {
            expect(() => {
                // create menu with customized `createMenuItemElement` function.
                let createMenuItemElement = jest.fn(() => '<div></div><li></li>');
                let menu = createMenuFromTemplate(NO_ITEM, {
                    createMenuItemElement
                });

                menu.setItems([
                    { key: 'A' },
                ]);
            }).toThrow('The string returned from your "createMenuItemElement(...)" function contains more than one element.');
        });

        test.each([
            3,
            false,
            null,
            undefined,
            {},
            []
        ])('Invalid case: function returns %p', (value) => {
            expect(() => {
                // create menu with customized `createMenuItemElement` function.
                let createMenuItemElement = jest.fn(() => value);
                let menu = createMenuFromTemplate(NO_ITEM, {
                    createMenuItemElement
                });

                menu.setItems([
                    { key: 'A' },
                ]);
            }).toThrow('The string returned from your "createMenuItemElement(...)" function doesn\'t represents a valid HTML.');
        })
    });

    describe('set menu items', () => {
        test.each([
            [
                "only one item is actived.",
                { key: 'A', data: 'A', actived: true }, // data can be anything.
                { key: 'B', data: 'B' },
                { key: 'C', data: 'C' }
            ],
            [
                "no item is actived.",
                { key: 'A', data: 'A' },
                { key: 'B', data: 'B' },
                { key: 'C', data: 'C' }
            ],
            [
                "explicitly specifiy if items are actived.",
                { key: 'A', data: 'A', actived: false },
                { key: 'B', data: 'B', actived: false },
                { key: 'C', data: 'C', actived: true }
            ]
        ])('Normal situation: %s', async (_, ...data) => {
            // create menu with customized `createMenuItemElement` function.
            let createMenuItemElement = jest.fn(({ key, data, actived }) => `
                <li><a href="javascript:void(0);">${data}</a></li>`
            );
            let menu = createMenuFromTemplate(NO_ITEM, {
                createMenuItemElement
            });

            menu.setItems(data);

            await tick();

            let menuItems = menu.el.querySelectorAll('.menu > .menu__item');
            expect(menuItems.length).toBe(data.length);

            for (let i = 0; i < data.length; i++) {
                let dataForRendering = createMenuItemElement.mock.calls[i][0];
                expect(typeof data === 'object' && data !== undefined).toBe(true);
                expect(dataForRendering).toEqual(data[i]);
            }
    
            for (let i = 0; i < data.length; i++) {
                expect(menuItems[i].dataset.key).toBe(data[i].key);
                expect(menuItems[i].textContent.trim()).toBe(data[i].data);
                expect(menuItems[i].classList.contains('actived')).toBe(Boolean(data[i].actived));
            }
        });

        it('invalid setItem(...)', () => {
            expect(() => {
                // create menu with customized `createMenuItemElement` function.
                let createMenuItemElement = jest.fn(({ key }) => `<li><a href="javascript:void(0);">${key}</a></li>`);
                let menu = createMenuFromTemplate(NO_ITEM, {
                    createMenuItemElement
                });

                menu.setItems([
                    { key: 'A', data: 'A', actived: false },
                    { key: 'B', data: 'B', actived: true },
                    { key: 'C', data: 'C', actived: true }
                ]);
            }).toThrow('Only one item can be actived at a time.');
        });
    });

    describe('setActivedItem(...)', () => {
        it('correct case', () => {
            let menu = createMenuFromTemplate(NONE_OF_ITEMS_ARE_ACTIVED);
            menu.setActivedItem('A');

            let elActivedItem = el.querySelector('.menu__item.actived')
            expect(elActivedItem).toBe(el.children[0]);
            expect(elActivedItem.textContent).toBe('first');
        })
    });
});
