import {waitForElement} from '../utils/dom_utils.ts';
import {log} from "../../logger.ts";
import {generateProfRating} from "../utils/rmp_utils.ts";

export async function handleNewSite() {
    let iframeDoc: Document;
    let wrapper: HTMLElement;

    await waitForElement((): boolean => {
        const iframe = document.getElementById("main_iframe") as HTMLIFrameElement;

        if (iframe && iframe.contentDocument) {
            iframeDoc = iframe.contentDocument;
            const el = iframeDoc.querySelector(".cx-MuiTypography-root.cx-MuiTypography-h2.cx-MuiTypography-colorTextPrimary");
            log.debug("Found in iframe:", el?.textContent);
            if (el == null || el.textContent !== "Class Search") return false;

            // Check if the wrapper object which contains all the class data for the search as its children exists
            // Note that this object can exist on other pages as well but for it won't if the page name is "Class Search"
            wrapper = iframeDoc.querySelector(".cx-MuiGrid-root.cx-MuiGrid-container.cx-MuiGrid-spacing-xs-1.cx-MuiGrid-direction-xs-column") as HTMLElement;
            if (!wrapper) return false;
            // Page is initially empty until the user searches for classes
            // When a user searches for classes a new element is added to the wrapper as a child making the length 3 -> 4
            if (wrapper.children.length < 4) return false;
        }
        return true;
    }).then(async () => {
        log.debug("✅ Conditions met: on 'Class Search' page and wrapper exists.");

        const thirdChild: Element | null = wrapper.children[2] ?? null;
        if (!thirdChild || thirdChild.children.length !== 1) {
            log.warn("Fourth child missing or doesn't have exactly one child.");
            return;
        }

        const classGroupContainer: Element = thirdChild.children[0];

        for (const classType of Array.from(classGroupContainer.children)) {
            const classTypeChildren = Array.from(classType.children);
            const sectionsContainer: Element | undefined = classTypeChildren[1];
            if (!sectionsContainer) continue;

            for (const section of Array.from(sectionsContainer.children)) {
                try {
                    // Traverse: section > div > div
                    const firstDiv: Element | null = section.querySelector("div > div");
                    if (!firstDiv || firstDiv.children.length < 2) {
                        log.warn("section > div > div or its children not found.");
                        continue;
                    }

                    // section > div > div > div:nth-child(2)
                    const secondDiv: Element | null = firstDiv.children[1] ?? null;
                    if (!secondDiv || secondDiv.children.length < 4) {
                        log.warn("section > div > div > div:nth-child(2) or its children not found.");
                        continue;
                    }

                    // section > div > div > div:nth-child(2) > div:nth-child(4)
                    const fourthDiv: Element | null = secondDiv.children[3] ?? null;
                    if (!fourthDiv || fourthDiv.children.length < 6) {
                        log.warn("section > div > div > div:nth-child(2) > div:nth-child(4) or its children not found.");
                        continue;
                    }

                    const sourceElement: Element | null = fourthDiv.children[0] ?? null;
                    if (!sourceElement) {
                        log.warn("Source element to clone not found.");
                        continue;
                    }

                    // Strip "Instructor:" prefix from element textContent
                    const instructorNameString = (fourthDiv.children[4].textContent as string).substring(11);

                    // Check if we've already injected ratings for this section
                    const lastChild: HTMLElement = fourthDiv.children[fourthDiv.children.length - 1] as HTMLElement;
                    if (lastChild.hasAttribute("data-registron-injected")) {
                        log.debug("Skipping section: already injected.");
                        continue;
                    }
                    lastChild.setAttribute("data-registron-injected", "true");

                    // Generate ratings for all professors (single or multiple)
                    const ratingElements = await generateProfRating(instructorNameString);
                    if (ratingElements !== null && ratingElements.length > 0) {
                        let newNode: HTMLElement = lastChild.cloneNode(true) as HTMLElement;
                        // @ts-ignore
                        newNode.firstChild.childNodes[0].textContent = "Ratings:"
                        // @ts-ignore
                        let secondColumnTableEntry = newNode.firstChild.childNodes[1].firstChild.firstChild;
                        if (secondColumnTableEntry === null) return;
                        secondColumnTableEntry.removeChild(secondColumnTableEntry.childNodes[0]);

                        // Create a container for the rating boxes to place them side by side
                        const ratingsContainer = document.createElement("div");
                        ratingsContainer.style.display = "flex"; // Use flexbox for side-by-side layout
                        ratingsContainer.style.gap = "5px"; // Add some spacing between rating boxes
                        ratingsContainer.setAttribute("data-registron-injected", "true");

                        // Append each rating element to the container
                        ratingElements.forEach((ratingHtml) => {
                            const tempDiv = document.createElement("div");
                            tempDiv.innerHTML = ratingHtml;
                            ratingsContainer.appendChild(tempDiv.firstChild!); // Append the <td> element
                        });

                        // Inject the container after the last child
                        secondColumnTableEntry.appendChild(ratingsContainer)
                        fourthDiv.appendChild(newNode);
                        log.debug("✅ Injected rating elements into section.");
                    }
                } catch (e) {
                    log.error("❌ Error while injecting element:", e);
                }
            }
        }
    }).catch(() => {
        log.debug("❌ Promise rejected: conditions not met.");
    });
}