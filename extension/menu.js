(() => {
  "use strict";
  if (window.__SPX_OPS_MENU_SCRIPT__) return;
  window.__SPX_OPS_MENU_SCRIPT__ = true;

  const ID = "spx-ops-native-menu";
  const items = [
    ["fms", "FMS Audit"],
    ["delivery", "Delivery Performance"],
    ["delivery-month", "Delivery Performance (Month)"],
    ["pickup", "Pickup Assignment"]
  ];
  let menu = null;
  let expanded = false;
  let active = "";
  let queued = false;

  function installStyle() {
    if (document.getElementById("spx-ops-menu-style") || !document.head) return;
    const style = document.createElement("style");
    style.id = "spx-ops-menu-style";
    style.textContent = [
      "#" + ID + "{list-style:none;border-top:1px solid transparent;border-bottom:1px solid transparent;color:rgba(255,255,255,.7)}",
      "#" + ID + ">.ssc-menu-submenu-title{min-height:44px;display:flex;align-items:center;gap:12px;padding:0 14px;cursor:pointer;color:inherit}",
      "#" + ID + " .title-icon{width:24px;height:24px;flex-shrink:0}",
      "#" + ID + " .sub-menu-title{flex:1}",
      "#" + ID + " .submenu-icon{width:20px;height:20px;transition:transform .15s}",
      "#" + ID + ".ssc-menu-opened .submenu-icon{transform:rotate(180deg)}",
      "#" + ID + ">ul.ssc-menu{list-style:none;margin:0;padding:0;background:#0e1723}",
      "#" + ID + " button.ssc-menu-item{display:block;box-sizing:border-box;width:100%;min-height:40px;border:0;border-radius:0;padding:10px 10px 10px 44px;background:transparent;text-align:left;color:rgba(255,255,255,.7);font:inherit;font-size:14px;cursor:pointer}",
      "#" + ID + " button.ssc-menu-item:hover{background:rgba(255,255,255,.08);color:#fff}",
      "#" + ID + " button.ssc-menu-item.ssc-menu-item-active{background:#ee4d2d;color:#fff}",
      "#" + ID + " button:focus-visible,#" + ID + " [role=button]:focus-visible{outline:2px solid #ee4d2d;outline-offset:-2px}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function outboundMenu() {
    for (const li of document.querySelectorAll("li.ssc-menu-submenu")) {
      if (li.id === ID || li.closest("#" + ID)) continue;
      const label = li.querySelector(":scope > .ssc-menu-submenu-title > .sub-menu-title");
      if (label?.textContent.trim() === "Outbound") return li;
    }
    return null;
  }

  function redraw() {
    if (!menu?.isConnected) return;
    menu.classList.toggle("ssc-menu-opened", expanded);
    menu.style.background = expanded ? "#0e1723" : "";
    const title = menu.querySelector(":scope > .ssc-menu-submenu-title");
    const list = menu.querySelector(":scope > ul.ssc-menu");
    title?.setAttribute("aria-expanded", String(expanded));
    if (list) list.style.display = expanded ? "block" : "none";
    menu.querySelectorAll("[data-spx-tool]").forEach(button => {
      const current = button.dataset.spxTool === active;
      button.classList.toggle("ssc-menu-item-active", current);
      if (current) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  function createMenu() {
    const li = document.createElement("li");
    li.id = ID;
    li.className = "submenu ssc-menu-submenu";
    const title = document.createElement("div");
    title.className = "ssc-menu-submenu-title";
    title.tabIndex = 0;
    title.setAttribute("role", "button");
    title.setAttribute("aria-label", "Uyển Ni");
    title.innerHTML =
      '<svg class="title-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3c1.9 0 3.1 1.4 3.1 3.3 0 2.1-1.7 4.4-3.1 5.7-1.4-1.3-3.1-3.6-3.1-5.7C8.9 4.4 10.1 3 12 3z"/><path d="M12 3c1.9 0 3.1 1.4 3.1 3.3 0 2.1-1.7 4.4-3.1 5.7-1.4-1.3-3.1-3.6-3.1-5.7C8.9 4.4 10.1 3 12 3z" transform="rotate(72 12 12)"/><path d="M12 3c1.9 0 3.1 1.4 3.1 3.3 0 2.1-1.7 4.4-3.1 5.7-1.4-1.3-3.1-3.6-3.1-5.7C8.9 4.4 10.1 3 12 3z" transform="rotate(144 12 12)"/><path d="M12 3c1.9 0 3.1 1.4 3.1 3.3 0 2.1-1.7 4.4-3.1 5.7-1.4-1.3-3.1-3.6-3.1-5.7C8.9 4.4 10.1 3 12 3z" transform="rotate(216 12 12)"/><path d="M12 3c1.9 0 3.1 1.4 3.1 3.3 0 2.1-1.7 4.4-3.1 5.7-1.4-1.3-3.1-3.6-3.1-5.7C8.9 4.4 10.1 3 12 3z" transform="rotate(288 12 12)"/><circle cx="12" cy="12" r="2" fill="#0e1723"/></svg>' +
      '<span class="sub-menu-title">Uyển Ni</span>' +
      '<span class="ssc-menu-submenu-title-icon"><svg class="submenu-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m7 10 5 5 5-5-1.4-1.4L12 12.2 8.4 8.6z"/></svg></span>';
    const list = document.createElement("ul");
    list.className = "ssc-menu";
    items.forEach(([tab, label]) => {
      const wrapper = document.createElement("div");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "submenu-item ssc-menu-item";
      button.dataset.spxTool = tab;
      button.textContent = label;
      wrapper.appendChild(button);
      list.appendChild(wrapper);
    });
    li.append(title, list);
    function toggle(event) {
      event.preventDefault();
      event.stopPropagation();
      expanded = !expanded;
      redraw();
    }
    title.addEventListener("click", toggle);
    title.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") toggle(event);
    });
    list.addEventListener("click", event => {
      const button = event.target instanceof Element ? event.target.closest("[data-spx-tool]") : null;
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      active = button.dataset.spxTool;
      expanded = true;
      redraw();
      window.dispatchEvent(new CustomEvent("SPX_OPS_OPEN", {detail:{tab:active}}));
    });
    return li;
  }

  function attach() {
    queued = false;
    if (menu?.isConnected) return;
    const anchor = outboundMenu();
    if (!anchor?.parentElement) return;
    installStyle();
    menu = document.getElementById(ID) || createMenu();
    anchor.insertAdjacentElement("afterend", menu);
    redraw();
    window.dispatchEvent(new Event("SPX_OPS_MENU_READY"));
  }

  function queueAttach() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(attach);
  }
  new MutationObserver(() => {
    if (!menu?.isConnected) queueAttach();
  }).observe(document.documentElement, {childList:true, subtree:true});
  queueAttach();

  function closeOnNativeNavigation() {
    if (!active) return;
    active = "";
    redraw();
    window.dispatchEvent(new Event("SPX_OPS_NATIVE_NAV"));
  }
  document.addEventListener("click", event => {
    const anchor = event.target instanceof Element ? event.target.closest('a[href^="#/"]') : null;
    if (anchor && !anchor.closest("#" + ID)) closeOnNativeNavigation();
  }, true);
  window.addEventListener("hashchange", closeOnNativeNavigation);
  window.addEventListener("SPX_OPS_CLOSED", () => {
    active = "";
    redraw();
  });
})();
