export function waitForElement(getterFn: { (): any; (): any; }, maxRetries = 50, delay = 100): Promise<HTMLElement> {
    return new Promise(async (resolve, reject) => {
        let retries = 0;
        let element;
        while (!element && retries < maxRetries) {
            element = getterFn();
            if (element) break;
            await new Promise(res => setTimeout(res, delay));
            retries++;
        }
        if (element) resolve(element);
        else reject("Element not found");
    });
}

export function getIframeDocument() {
    let iframe: HTMLIFrameElement | null = null;
    for (let i = 0; i < 5 && !iframe; i++) {
        iframe = <HTMLIFrameElement>document.getElementById(`ptModFrame_` + i);
    }
    if (!iframe) iframe = <HTMLIFrameElement>document.getElementById("ptifrmtgtframe");
    if (iframe) {
        // @ts-ignore
        return iframe.contentDocument || iframe.contentWindow.document;
    } else {
        return null;
    }
}

/**
 * Finds the first element of a given tag type that contains the specified text.
 *
 * @param tag - The tag name to search for (e.g., "div", "span", "h2", or "*" for all tags).
 * @param text - The text content to match against.
 * @param exactMatch - If true, matches the text exactly; if false, matches if the text is included. Defaults to true.
 * @returns The first matching Element, or null if no match is found.
 *
 * @example
 * ```ts
 * const el = findElementByText("h2", "Class Search");
 * const el2 = findElementByText("*", "Search", false);
 * ```
 */
export function findElementByText(
    tag: keyof HTMLElementTagNameMap | "*",
    text: string,
    exactMatch: boolean = true
): Element | null {
    const elements = document.querySelectorAll(tag);
    for (const el of elements) {
        const content = el.textContent?.trim();
        if (exactMatch ? content === text : content?.includes(text)) {
            return el;
        }
    }
    return null;
}

/**
 * Finds all elements of a given tag type that match the specified text.
 *
 * @param tag - The tag name to search for (e.g., "div", "span", "h2", or "*" for all tags).
 * @param text - The text content to match against.
 * @param exactMatch - If true, matches the text exactly; if false, matches if the text is included. Defaults to true.
 * @returns An array of all matching elements.
 *
 * @example
 * ```ts
 * const matches = findAllElementsByText("div", "Class Search");
 * const partialMatches = findAllElementsByText("*", "Search", false);
 * ```
 */
export function findAllElementsByText(
    tag: string,
    text: string,
    exactMatch: boolean = true
): Element[] {
    const elements = document.querySelectorAll(tag);
    return Array.from(elements).filter((el) => {
        const content = el.textContent?.trim();
        return exactMatch ? content === text : content?.includes(text);
    });
}