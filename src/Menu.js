import { EventEmitter } from 'events';

/**
 * 
 * @param {string} str string to be parsed.
 */
function parseHTML (str) {
    let trimmed = str.trim();
    let el = document.createElement('div');
    el.innerHTML = trimmed;

    if (el.firstElementChild === null || el.innerHTML !== trimmed) {
        throw new Error('The string returned from your "createMenuItemElement(...)" function doesn\'t represents a valid HTML.');
    }

    if (el.children.length > 1) {
        throw new Error('The string returned from your "createMenuItemElement(...)" function contains more than one element.');
    }

    return el.firstElementChild;
}

function filterElementsByClass (listOfEl, className) {
    return Array.prototype.filter.call(listOfEl, hasClass.bind(null, className));
}

function hasClass (className, el) {
    return el.classList.contains(className);
}

/**
 * Problems:
 * 1. 
 */

/**
 * # Behaviours
 * 1. Emit an 'active' event when we click a menu item.
 * 2. Update the current actived item after clicking
 * 
 * # Responsibility
 * 1. Verify the Element
 * 2. Handle item clicking
 * 
 * # Convention
 * 1. Assumed that the Menu's elements should always be operated by the Menu object.
 * 
 * @typedef {{ key: string, content: string, actived: boolean }} MenuItem
 * @typedef {{ createMenuItemElement: MenuItem => Element }} MenuOptions
 * 
 */
class Menu extends EventEmitter {
    /**
     * @param {Element} el 
     * @param {MenuOptions} opts 
     */
    constructor (el, opts) {
        super();

        this._verifyOptions(opts);
        this._opts = Object.assign({}, opts);

        let menuItems = filterElementsByClass(el.children, this.itemClass);
        this._verifyMenuElements(menuItems);

        this._el = el;
        this._$activedItem = this._findActivedItem();

        this._el.classList.add(this.rootClass);

        this._bindClickEvents();
    }

    /**
     * @param {MenuItem[]} menuItems 
     */
    setItems (menuItems) {
        let numberOfActivedItem = menuItems.filter(item => Boolean(item.actived)).length;
        if (numberOfActivedItem > 1) {
            throw new Error('Only one item can be actived at a time.');
        }
        let docFrag = document.createDocumentFragment();

        for (let item of menuItems) {
            let el = this._createMenuItemElement(item);
            docFrag.appendChild(el);
        }

        this._el.innerHTML = '';
        this._el.appendChild(docFrag);

        this._bindClickEvents();

        this._$activedItem = this._findActivedItem();
    }

    _verifyMenuElements (menuItems) {
        let arrOfActivedItem = filterElementsByClass(menuItems, this.activedClass);
        if (arrOfActivedItem.length > 1) {
            throw new Error('Only one item can be actived at a time.');
        }
    
        let errors = this._verifyKeysForMenuItem(menuItems);
        if (errors.hasDuplicatedKey) {
            throw new Error('There are some items\' key that are duplicated.')
        }
        if (errors.noKey) {
            throw new Error('There are some items have no key.')
        }

        if (this._hasMultipleActivedItems(menuItems)) {
            throw new Error('Only one item can be actived at a time.');
        }
    }
    
    _verifyOptions (opts) {
        if (typeof opts !== 'object' || opts === null) {
            throw new Error('missed the option');
        }
    
        if (typeof opts.createMenuItemElement !== 'function') {
            throw new Error('missed the function createMenuItemElement');
        }
    
        if (typeof opts.rootClass !== 'string') {
            throw new Error('missing the rootClass in the option');
        }

        if (typeof opts.itemClass !== 'string') {
            throw new Error('missing the itemClass in the option');
        }

        if (typeof opts.activedClass !== 'string') {
            throw new Error('missing the activedClass in the option');
        }
    }

    _verifyKeysForMenuItem (menuItems) {
        let errors = {
            noKey: false,
            hasDuplicatedKey: false
        };

        let keySet = new Set();

        for (let item of menuItems) {
            let key = item.dataset.key;
            if (key === undefined) {
                errors.noKey = true;
                break;
            }

            if (keySet.has(key)) {
                errors.hasDuplicatedKey = true;
                break;
            }

            keySet.add(key);
        }

        return errors;
    }

    /**
     * 
     * @param {MenuItem} item 
     */
    _createMenuItemElement (item) {
        let el;
        let elOrStr =  this._opts.createMenuItemElement(Object.assign({}, item));

        if (typeof elOrStr === 'string') {
            el = parseHTML(elOrStr);
        } else if (elOrStr instanceof Element) {
            el = elOrStr;
        } else {
            throw new Error('The string returned from your "createMenuItemElement(...)" function doesn\'t represents a valid HTML.');
        }

        el.dataset.key = item.key;

        if (item.actived) {
            el.classList.add(this.itemClass, this.activedClass);
        } else {
            el.classList.add(this.itemClass);
        }

        return el;
    }

    _hasMultipleActivedItems (items) {
        let count = 0;

        for (let item of items) {
            if (this._isMenuItemActived(item)) {
                count++;
            }
            if (count > 1) {
                return true;
            }
        }

        return false;
    }
    
    _getMenuItems () {
        return filterElementsByClass(this._el.children, this.itemClass);
    }

    _setMenuItemActive (item) {
        item.classList.add(this.activedClass);
    }
    
    _setMenuItemInactive (item) {
        item.classList.remove(this.activedClass);
    }
    
    _isMenuItemActived (item) {
        return hasClass(this.activedClass, item);
    }

    _isMenuItem (item) {
        return hasClass(this.itemClass, item);
    }

    _findActivedItem () {
        let activedItem = this._getMenuItems().find(this._isMenuItemActived.bind(this));
        return (activedItem === undefined) ? null : activedItem;
    }

    _bindClickEvents () {
        let items = this._getMenuItems();

        for (let item of items) {
            item.addEventListener('click', () => {
                let oldKey = (this._$activedItem === null) ?
                    null :
                    this._$activedItem.dataset.key;

                this._adjustActivedItem(this._$activedItem, item);
                this.emit('active', {
                    key: this._$activedItem.dataset.key,
                    oldKey
                });
            });
        }
    }

    _adjustActivedItem (oldItem, newItem) {
        if (oldItem === newItem) {
            return;
        }

        this._setMenuItemActive(newItem);
        if (oldItem !== null) {
            this._setMenuItemInactive(oldItem)
        }

        this._$activedItem = newItem;
    }

    get el () {
        return this._el;
    }

    get activedClass () {
        return this._opts.activedClass;
    }

    get rootClass () {
        return this._opts.rootClass;
    }

    get itemClass () {
        return  this._opts.itemClass;
    }
}

export default Menu;
