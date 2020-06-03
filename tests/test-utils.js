export function tick (delay = 0) {
    return new Promise(function (resolve) {
        setTimeout(() => {
            resolve();
        }, delay);
    });
}
