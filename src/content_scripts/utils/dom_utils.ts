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