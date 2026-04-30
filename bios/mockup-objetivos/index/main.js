const tabs = Array.from(document.querySelectorAll(".tabbar .tab[data-view]"));
const workspace = document.querySelector(".workspace");
const planView = document.querySelector('[data-content="plan"]');
const embeddedView = document.querySelector('[data-content="embedded"]');
const embeddedFrame = document.getElementById("contentGridFrame");
const embeddedTitle = document.getElementById("embeddedContentTitle");
const embeddedDescription = document.getElementById("embeddedContentDescription");
const hideRightRailButton = document.getElementById("hideRightRail");
const showRightRailButton = document.getElementById("showRightRail");
const modal = document.getElementById("objectivesModal");
const openButton = document.getElementById("openObjectivesModal");
const pdvButton = document.getElementById("openPdvModal");
const closeButton = document.getElementById("closeObjectivesModal");
const modalTabs = Array.from(document.querySelectorAll(".modal-tab"));
const modalContentFrame = document.getElementById("modalContentFrame");

function setRightRailVisibility(isVisible) {
	workspace.classList.toggle("is-right-rail-hidden", !isVisible);
	hideRightRailButton.setAttribute("aria-expanded", isVisible ? "true" : "false");
	showRightRailButton.setAttribute("aria-expanded", isVisible ? "true" : "false");
	showRightRailButton.hidden = isVisible;
}

function activateTab(viewName) {
	const selectedTab = tabs.find((tab) => tab.dataset.view === viewName);

	if (!selectedTab) {
		return;
	}

	tabs.forEach((tab) => {
		const isSelected = tab === selectedTab;
		tab.classList.toggle("is-active", isSelected);
		tab.setAttribute("aria-selected", isSelected ? "true" : "false");
	});

	if (viewName === "plan") {
		planView.hidden = false;
		embeddedView.hidden = true;
		return;
	}

	planView.hidden = true;
	embeddedView.hidden = false;
	embeddedTitle.textContent = selectedTab.dataset.title;
	embeddedDescription.textContent = selectedTab.dataset.description;
	embeddedFrame.src = selectedTab.dataset.src;
	embeddedFrame.title = selectedTab.dataset.title;
}

tabs.forEach((tab) => {
	tab.addEventListener("click", () => {
		activateTab(tab.dataset.view);
	});

	tab.addEventListener("keydown", (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			activateTab(tab.dataset.view);
		}
	});
});

hideRightRailButton.addEventListener("click", () => {
	setRightRailVisibility(false);
});

showRightRailButton.addEventListener("click", () => {
	setRightRailVisibility(true);
});

function activateModalTab(viewName) {
	const selectedTab = modalTabs.find((tab) => tab.dataset.modalView === viewName);

	if (!selectedTab) {
		return;
	}

	modalTabs.forEach((tab) => {
		const isSelected = tab === selectedTab;
		tab.classList.toggle("is-active", isSelected);
		tab.setAttribute("aria-selected", isSelected ? "true" : "false");
	});

	modalContentFrame.src = selectedTab.dataset.src;
	modalContentFrame.title = "Objetivos y KPIs";
}

modalTabs.forEach((tab) => {
	tab.addEventListener("click", () => {
		activateModalTab(tab.dataset.modalView);
	});

	tab.addEventListener("keydown", (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			activateModalTab(tab.dataset.modalView);
		}
	});
});

function openModal(src) {
	modalContentFrame.src = src;
	modal.classList.add("is-open");
	modal.setAttribute("aria-hidden", "false");
	document.body.style.overflow = "hidden";
}

function closeModal() {
	modal.classList.remove("is-open");
	modal.setAttribute("aria-hidden", "true");
	document.body.style.overflow = "";
}

openButton.addEventListener("click", () => openModal("iframe.html?embedded=true&canal=1"));
pdvButton?.addEventListener("click", () => openModal("iframe.html?embedded=true&canal=2"));
closeButton.addEventListener("click", closeModal);

(function applyCanal() {
    const canal = new URLSearchParams(location.search).get('canal');
    const url = canal === '2' ? 'iframe.html?canal=2' : 'iframe.html?canal=1';

    if (canal === '1') { pdvButton.hidden = true; }
    else if (canal === '2') { openButton.hidden = true; }

    document.getElementById('openTabLink').addEventListener('click', (e) => {
        e.preventDefault();
        window.open(url, '_blank', 'noopener');
    });

    const mobileLink = document.getElementById('mobileIframeLink');
    mobileLink.href = url;
    mobileLink.textContent = url;
}());

modal.addEventListener("click", (event) => {
	if (event.target === modal) {
		closeModal();
	}
});

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape" && modal.classList.contains("is-open")) {
		closeModal();
	}
});

setRightRailVisibility(true);

/* ---- Mobile shell logic ---- */
document.addEventListener('DOMContentLoaded', () => {
	const mTabs = document.querySelectorAll('.m-tab');
	const mPanels = document.querySelectorAll('.m-panel');

	mTabs.forEach(tab => {
		tab.addEventListener('click', () => {
			const target = tab.dataset.panel;
			mTabs.forEach(t => t.classList.toggle('is-active', t === tab));
			mPanels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === target));
		});
	});
});