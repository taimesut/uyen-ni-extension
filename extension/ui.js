(() => {
  "use strict";

  if (window.__SPX_FMS_AUDIT_UI__) return;
  window.__SPX_FMS_AUDIT_UI__ = true;

  const STATUSES = Array.isArray(globalThis.SPX_FMS_STATUS_OPTIONS)
    ? globalThis.SPX_FMS_STATUS_OPTIONS
    : [];
  const STATUS_MAP = new Map(STATUSES.map(x => [String(x.code), x.name]));
  const DEFAULT_STATUSES = ["880", "36", "15"];
  const PAGE_SIZE = 25;

  function localDateInputValue(date) {
    const d = date || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  const state = {
    open:false, activeTab:"fms",
    loading:false, bridgeReady:false, requestId:"",
    currentStation:"1030", nextStation:"1812",
    selectedStatuses:DEFAULT_STATUSES.slice(),
    rows:[], total:0, applied:null,
    search:"", aging:"ALL", orderStatus:"ALL", page:1,
    picker:false, error:"", progress:"",
    delivery:{
      startDate:localDateInputValue(new Date()),
      loading:false,
      requestId:"",
      progress:"",
      error:"",
      taskId:0,
      stationName:"",
      fileName:"",
      csvText:"",
      rows:[],
      totals:null,
      previewDataUrl:"",
      previewOpen:false
    }
  };

  const esc = v => String(v ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  const stationName = id =>
    id === "1030" ? "1030 - Pleiku SOC" : "1812 - Pleiku 03 Hub";

  const statusName = code =>
    STATUS_MAP.get(String(code)) || ("Status " + code);

  const hours = ts =>
    Number(ts) > 0 ? Math.max(0, Date.now() - Number(ts) * 1000) / 3600000 : null;

  function aging(ts) {
    const h = hours(ts);
    if (h === null) return "—";
    if (h < 24) return "< 24H";
    if (h <= 36) return "24H → 36H";
    return "> 36H";
  }

  function elapsed(ts) {
    const h = hours(ts);
    return h === null ? "—" : (h < .1 ? "< 0.1 giờ" : h.toFixed(1) + " giờ");
  }

  function dateTime(ts) {
    if (!Number(ts)) return "—";
    return new Intl.DateTimeFormat("vi-VN",{
      day:"2-digit",month:"2-digit",year:"numeric",
      hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false
    }).format(new Date(Number(ts) * 1000));
  }

  function normalizeRows(rows) {
    return (Array.isArray(rows) ? rows : []).map(row => ({
      shipmentId:String(row?.shipment_id || ""),
      to:String(row?.current_to_number || ""),
      orderStatus:String(row?.order_status || ""),
      current:String(row?.current_station_name || ""),
      next:String(row?.next_station_name || ""),
      latest:row?.latest_tracking_event || null,
      error:String(row?.tracking_error || "")
    })).filter(x => x.shipmentId);
  }

  function post(type, payload={}) {
    window.postMessage({source:"SPX_FMS_AUDIT_UI",type,...payload},window.location.origin);
  }

  function load() {
    if (state.loading) return;
    state.loading = true;
    state.error = "";
    state.progress = "Đang tải danh sách FMS...";
    state.requestId = Date.now() + "_" + Math.random().toString(36).slice(2);
    state.search = "";
    state.aging = "ALL";
    state.orderStatus = "ALL";
    state.page = 1;
    render();

    post("SPX_FMS_FETCH",{
      requestId:state.requestId,
      filters:{
        current_station_id:state.currentStation,
        next_station_id:state.nextStation,
        order_status:state.selectedStatuses.slice()
      }
    });
  }

  function filteredRows() {
    const q = state.search.trim().toLowerCase();
    const allowed = state.applied?.statuses?.length
      ? new Set(state.applied.statuses.map(String))
      : null;

    return state.rows.filter(row => {
      if (allowed && !allowed.has(row.orderStatus)) return false;
      if (state.orderStatus !== "ALL" && row.orderStatus !== state.orderStatus) return false;
      if (state.aging !== "ALL" && aging(row.latest?.timestamp) !== state.aging) return false;
      if (!q) return true;
      return [
        row.shipmentId,row.to,row.orderStatus,statusName(row.orderStatus),
        row.current,row.next
      ].some(v => String(v || "").toLowerCase().includes(q));
    }).sort((a,b) => Number(a.latest?.timestamp || 0) - Number(b.latest?.timestamp || 0));
  }

  function resultStatuses() {
    const source = state.applied?.statuses?.length
      ? state.applied.statuses
      : [...new Set(state.rows.map(x => x.orderStatus).filter(Boolean))];
    return source.slice().sort((a,b) => Number(a)-Number(b));
  }

  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:18px;top:18px;z-index:2147483646";
  const shadow = host.attachShadow({mode:"open"});
  document.documentElement.appendChild(host);

  const style = document.createElement("style");
  style.textContent = `
    :host{all:initial;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#26292e}
    *{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer}
    .launch{height:50px;padding:0 18px;border:0;border-radius:14px;background:#ee4d2d;color:#fff;font-weight:900;box-shadow:0 12px 30px #0003}
    .app{position:fixed;inset:0;width:100vw;height:100vh;background:#f5f6f8;display:flex;flex-direction:column;z-index:2147483647}
    .header{height:68px;flex:0 0 68px;padding:0 22px;background:#fff;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between}
    .brand{display:flex;align-items:center;gap:12px}.logo{width:40px;height:40px;border-radius:12px;background:#ee4d2d;color:#fff;display:grid;place-items:center;font-weight:950}
    .title{font-size:17px;font-weight:950}.sub{font-size:10px;color:#7b8490;margin-top:2px}.close{width:38px;height:38px;border:1px solid #e2e5e9;border-radius:10px;background:#fff;font-size:20px}
    .main{flex:1;min-height:0;overflow:auto;padding:14px 18px 18px;display:grid;gap:12px}
    .card{background:#fff;border:1px solid #e2e5e9;border-radius:15px;overflow:visible}
    .cardhead{padding:11px 14px;border-bottom:1px solid #e7e9ed;background:#fafbfc;border-radius:15px 15px 0 0;display:flex;justify-content:space-between;align-items:center}
    .cardtitle{font-size:12px;font-weight:900}.hint{font-size:9.5px;color:#7c8590}
    .query{padding:12px 14px;display:grid;grid-template-columns:240px 28px 240px minmax(360px,1fr) 150px;gap:10px;align-items:end}
    .field{display:grid;gap:5px;position:relative}.label{font-size:9px;font-weight:900;text-transform:uppercase;color:#68717c}
    .input,.select,.pick{height:42px;width:100%;border:1px solid #d9dde3;border-radius:10px;background:#fff;padding:0 11px;outline:none;color:#30343a}
    .input:focus,.select:focus,.pick:focus{border-color:#f09b87;box-shadow:0 0 0 3px #ee4d2d12}
    .arrow{height:42px;display:grid;place-items:center;color:#929aa5;font-weight:900}.pick{text-align:left;font-size:11px;font-weight:800}
    .pop{position:absolute;z-index:50;top:66px;left:0;right:0;background:#fff;border:1px solid #dfe2e7;border-radius:12px;box-shadow:0 16px 40px #0002;max-height:360px;overflow:auto;padding:6px}
    .opt{display:flex;gap:8px;align-items:center;padding:7px;border-radius:7px;font-size:10px}.opt:hover{background:#f6f7f9}.opt span:first-of-type{flex:1}
    .primary{height:42px;border:0;border-radius:10px;background:#ee4d2d;color:#fff;font-size:11px;font-weight:900}.primary:disabled{opacity:.5}
    .progress,.error{padding:10px 13px;border-radius:11px;font-size:10px;font-weight:800}.progress{background:#fff8e8;border:1px solid #f1d7a5;color:#805812}.error{background:#fff1f4;border:1px solid #ffd1db;color:#a52b49}
    .tools{padding:10px 12px;display:grid;grid-template-columns:minmax(380px,1fr) 180px 300px;gap:9px;border-bottom:1px solid #e7e9ed}
    .meta{padding:8px 12px;background:#fbfcfd;border-bottom:1px solid #e7e9ed;font-size:9.5px;color:#727b86;display:flex;justify-content:space-between;gap:10px}
    .tablewrap{overflow:auto;max-height:calc(100vh - 305px);min-height:300px}table{width:100%;border-collapse:separate;border-spacing:0;min-width:1450px}
    th,td{padding:10px 11px;border-bottom:1px solid #edf0f2;text-align:left;vertical-align:top}th{position:sticky;top:0;z-index:2;background:#f8f9fa;font-size:9px;text-transform:uppercase;color:#646d78}td{font-size:10.5px;color:#505861}
    tbody tr:hover td{background:#fffaf8}.mono{font-family:ui-monospace,Consolas,monospace;font-weight:850;color:#30363d}.badge{display:inline-block;padding:3px 6px;border-radius:7px;background:#fff0ec;color:#c54429;font-size:9px;font-weight:900}.small{font-size:9px;color:#7b8490;margin-top:3px}
    .age{font-size:9px;font-weight:900;padding:4px 7px;border-radius:8px;background:#f5f6f8}.pager{height:46px;padding:0 12px;display:flex;align-items:center;justify-content:space-between;font-size:9.5px;color:#727b86}.pager button{height:30px;border:1px solid #e0e3e7;border-radius:8px;background:#fff}
    .empty{padding:60px;text-align:center;color:#818a95;font-size:11px}

    .tabs{display:flex;gap:6px;padding:6px;background:#eceff3;border-radius:11px;width:max-content}
    .tab{height:34px;padding:0 14px;border:0;border-radius:8px;background:transparent;color:#66707c;font-size:10.5px;font-weight:900}
    .tab.active{background:#fff;color:#ee4d2d;box-shadow:0 1px 5px #0001}
    .delivery-layout{display:grid;gap:12px}
    .delivery-form{padding:14px;display:grid;grid-template-columns:220px minmax(420px,1fr) auto;gap:16px;align-items:end}
    .delivery-flow{height:42px;display:flex;align-items:center;justify-content:center;gap:9px;border:1px dashed #d9dde3;border-radius:10px;background:#fafbfc;color:#66707b;font-size:10px;font-weight:800}
    .delivery-flow b{color:#a2a9b2}.delivery-form-actions{display:flex;gap:8px}
    .delivery-run{padding:0 18px}.ghostbtn{height:38px;padding:0 12px;border:1px solid #dfe3e8;border-radius:9px;background:#fff;color:#56606b;font-size:10px;font-weight:900}
    .task-chip{padding:5px 9px;border-radius:999px;background:#fff0ec;color:#c54429;font-size:9px;font-weight:900}
    .delivery-result{background:#fff;border:1px solid #e2e5e9;border-radius:15px;overflow:hidden}
    .delivery-result-head{padding:11px 14px;border-bottom:1px solid #e7e9ed;background:#fafbfc;display:flex;align-items:center;justify-content:space-between;gap:10px}
    .delivery-actions{display:flex;gap:7px}.delivery-table-wrap{overflow:auto;max-height:calc(100vh - 300px)}
    .delivery-table{width:100%;min-width:900px;border-collapse:collapse}
    .delivery-table th,.delivery-table td{padding:9px 11px;border:1px solid #d8dde2;text-align:center}
    .delivery-table thead th{position:sticky;top:0;background:#18a957;color:#fff;font-size:10px;font-style:italic;z-index:2}
    .delivery-table td{font-size:10.5px}.delivery-table .driver{text-align:left;font-weight:800}
    .delivery-table tr.rank-first td{background:#fff200}.delivery-table tr.rank-second td{background:#fff3dc}
    .delivery-table tr.rank-third td{background:#f8ded3}.delivery-table tr.rank-zero td{background:#effbea}
    .delivery-table tfoot th{background:#dff4fa;font-size:11px;font-weight:950}
    .delivery-empty{padding:80px 20px;text-align:center;border:1px dashed #d7dce2;border-radius:15px;background:#fff;color:#77818c;font-size:11px;line-height:1.7}
    .delivery-empty b{display:block;color:#374151;font-size:14px}.delivery-empty-icon{width:48px;height:48px;margin:0 auto 10px;border-radius:14px;background:#fff0ec;color:#ee4d2d;display:grid;place-items:center;font-size:24px;font-weight:900}
    .preview-backdrop{position:fixed;inset:0;z-index:2147483647;background:#111827cc;display:grid;place-items:center;padding:24px}
    .preview-modal{width:min(1500px,96vw);height:min(94vh,1000px);background:#fff;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 100px #0007}
    .preview-head{height:60px;flex:0 0 60px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb}
    .preview-scroll{flex:1;overflow:auto;background:#25282d;padding:20px;text-align:center}.preview-scroll img{max-width:100%;height:auto;box-shadow:0 8px 30px #0005}
    @media(max-width:900px){.delivery-form{grid-template-columns:1fr}.delivery-flow{flex-wrap:wrap;height:auto;min-height:42px;padding:8px}.tabs{width:100%}.tab{flex:1}}

    @media(max-width:900px){.query,.tools{grid-template-columns:1fr}.arrow{height:15px;transform:rotate(90deg)}}
  `;
  shadow.appendChild(style);

  const modernStyle = document.createElement("style");
  modernStyle.id = "spx-modern-ui-v150";
  modernStyle.textContent = `
    :host{
      --spx-primary:#ff5a36;
      --spx-primary-2:#ff7a59;
      --spx-purple:#7657ff;
      --spx-cyan:#18b7c9;
      --spx-green:#17a673;
      --spx-amber:#f4a51c;
      --spx-ink:#17202b;
      --spx-muted:#73808e;
      --spx-line:rgba(27,39,53,.09);
      --spx-surface:rgba(255,255,255,.86);
      --spx-shadow:0 16px 46px rgba(31,41,55,.10);
      --spx-shadow-lg:0 28px 80px rgba(24,32,45,.18);
    }

    @keyframes spxFadeUp{
      from{opacity:0;transform:translateY(10px)}
      to{opacity:1;transform:translateY(0)}
    }
    @keyframes spxPulse{
      0%,100%{box-shadow:0 0 0 0 rgba(23,166,115,.22)}
      50%{box-shadow:0 0 0 7px rgba(23,166,115,0)}
    }
    @keyframes spxShimmer{
      0%{background-position:200% 0}
      100%{background-position:-200% 0}
    }

    .launch{
      min-width:148px;
      height:52px;
      border-radius:16px;
      background:linear-gradient(135deg,var(--spx-primary),#ff8a5c 55%,#ffb052);
      box-shadow:0 16px 38px rgba(238,77,45,.34);
      transition:transform .18s ease,box-shadow .18s ease,filter .18s ease;
      position:relative;
      overflow:hidden;
      letter-spacing:.01em;
    }
    .launch::after{
      content:"";
      position:absolute;
      inset:-40% auto -40% -35%;
      width:38%;
      transform:rotate(18deg);
      background:linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent);
      transition:left .45s ease;
    }
    .launch:hover{transform:translateY(-2px) scale(1.015);box-shadow:0 20px 48px rgba(238,77,45,.42)}
    .launch:hover::after{left:110%}
    .launch:active{transform:translateY(0) scale(.985)}

    .app{
      background:
        radial-gradient(circle at 8% 0%,rgba(255,90,54,.10),transparent 28%),
        radial-gradient(circle at 98% 6%,rgba(118,87,255,.10),transparent 26%),
        radial-gradient(circle at 70% 92%,rgba(24,183,201,.08),transparent 24%),
        linear-gradient(180deg,#f9fafc 0%,#f3f5f8 100%);
    }

    .header{
      height:74px;
      flex-basis:74px;
      padding:0 24px;
      border-bottom:1px solid rgba(255,255,255,.72);
      background:rgba(255,255,255,.82);
      backdrop-filter:blur(18px) saturate(150%);
      -webkit-backdrop-filter:blur(18px) saturate(150%);
      box-shadow:0 1px 0 rgba(20,29,40,.06),0 8px 28px rgba(28,37,49,.04);
      position:relative;
      z-index:40;
    }
    .header::before{
      content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;
      background:linear-gradient(90deg,var(--spx-primary),#ff9f43,var(--spx-purple),var(--spx-cyan));
      opacity:.78;
    }
    .brand{gap:13px}
    .logo{
      width:44px;height:44px;border-radius:14px;
      background:linear-gradient(135deg,var(--spx-primary),#ff8b61);
      box-shadow:0 10px 24px rgba(238,77,45,.25),inset 0 1px 0 rgba(255,255,255,.25);
      font-size:17px;
      transform:rotate(-2deg);
    }
    .title{font-size:18px;letter-spacing:-.025em;color:var(--spx-ink)}
    .sub{font-size:10.5px;color:#7a8592}
    .header-actions{display:flex;align-items:center;gap:8px}
    .session-pill,.version-pill{
      height:34px;padding:0 11px;border-radius:999px;display:flex;align-items:center;gap:7px;
      font-size:9.5px;font-weight:850;border:1px solid rgba(25,42,60,.08);background:rgba(255,255,255,.78);
      color:#596674;
    }
    .session-dot{width:8px;height:8px;border-radius:50%;background:#20b37a;animation:spxPulse 1.8s ease-in-out infinite}
    .version-pill{color:#7457d7;background:rgba(118,87,255,.08);border-color:rgba(118,87,255,.13)}
    .close{
      width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.88);
      transition:all .16s ease;color:#66717d;
    }
    .close:hover{background:#fff0ec;color:#d94a2b;border-color:#ffd5ca;transform:rotate(4deg)}

    .main{padding:16px 20px 20px;gap:14px}
    .tabs{
      position:sticky;top:0;z-index:35;
      width:max-content;max-width:100%;padding:5px;
      border:1px solid rgba(32,44,58,.08);
      background:rgba(239,242,246,.76);
      backdrop-filter:blur(14px);
      border-radius:14px;
      box-shadow:0 8px 24px rgba(31,41,55,.06);
    }
    .tab{
      min-width:150px;height:38px;border-radius:10px;font-size:10.5px;
      transition:all .2s ease;position:relative;overflow:hidden;
    }
    .tab:hover{color:#394452;background:rgba(255,255,255,.62);transform:translateY(-1px)}
    .tab.active{
      color:#fff;
      background:linear-gradient(135deg,var(--spx-primary),#ff7958);
      box-shadow:0 8px 20px rgba(238,77,45,.22);
    }

    .card,.delivery-result{
      border:1px solid rgba(37,50,65,.08);
      border-radius:18px;
      background:var(--spx-surface);
      backdrop-filter:blur(10px);
      -webkit-backdrop-filter:blur(10px);
      box-shadow:var(--spx-shadow);
      animation:spxFadeUp .28s ease both;
    }
    .cardhead,.delivery-result-head{
      min-height:58px;padding:12px 16px;
      border-bottom:1px solid rgba(37,50,65,.075);
      background:linear-gradient(180deg,rgba(255,255,255,.88),rgba(248,250,252,.72));
      border-radius:18px 18px 0 0;
    }
    .cardtitle{font-size:13px;color:#2d3742;letter-spacing:-.01em}
    .hint{font-size:9.8px;color:#818b97;margin-top:2px}

    .query{padding:14px 16px;gap:12px}
    .label{font-size:9px;color:#74808d;letter-spacing:.08em}
    .input,.select,.pick{
      height:44px;border-radius:12px;border-color:rgba(38,51,65,.12);
      background:rgba(255,255,255,.92);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.55);
      transition:border-color .17s ease,box-shadow .17s ease,transform .17s ease;
    }
    .input:hover,.select:hover,.pick:hover{border-color:rgba(238,77,45,.32)}
    .input:focus,.select:focus,.pick:focus{
      border-color:rgba(238,77,45,.55);
      box-shadow:0 0 0 4px rgba(238,77,45,.09),0 8px 20px rgba(31,41,55,.05);
    }
    .pop{
      border-radius:15px;border-color:rgba(31,41,55,.10);
      box-shadow:0 22px 60px rgba(22,30,42,.18);
      backdrop-filter:blur(18px);background:rgba(255,255,255,.97);padding:7px;
    }
    .opt{border-radius:9px;transition:background .12s ease,transform .12s ease}
    .opt:hover{background:#fff3ef;transform:translateX(2px)}

    .primary{
      height:44px;border-radius:12px;
      background:linear-gradient(135deg,var(--spx-primary),#ff7855);
      box-shadow:0 10px 24px rgba(238,77,45,.22);
      transition:transform .16s ease,box-shadow .16s ease,filter .16s ease;
      position:relative;overflow:hidden;
    }
    .primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 30px rgba(238,77,45,.30);filter:saturate(1.08)}
    .primary:active:not(:disabled){transform:translateY(0) scale(.985)}
    .ghostbtn{
      height:40px;border-radius:10px;background:rgba(255,255,255,.9);
      transition:all .16s ease;box-shadow:0 3px 10px rgba(31,41,55,.04);
    }
    .ghostbtn:hover:not(:disabled){transform:translateY(-1px);border-color:#ffc7b9;background:#fff7f4;color:#cf4d31;box-shadow:0 8px 18px rgba(31,41,55,.08)}

    .progress{
      position:relative;overflow:hidden;
      background:linear-gradient(90deg,#fff8e9,#fff2df,#fff8e9);
      background-size:200% 100%;animation:spxShimmer 2s linear infinite;
      border-color:#f1d59a;color:#835a13;box-shadow:0 8px 22px rgba(244,165,28,.08);
    }
    .error{box-shadow:0 8px 22px rgba(169,45,72,.08)}

    .tools{padding:12px 14px;gap:10px;background:rgba(250,251,252,.62)}
    .meta{padding:10px 14px;background:rgba(247,249,251,.72)}
    .tablewrap,.delivery-table-wrap{scrollbar-color:#cfd5dc transparent;scrollbar-width:thin}
    table{border-spacing:0}
    th{
      background:linear-gradient(180deg,#f8fafc,#f3f6f9);
      color:#687380;letter-spacing:.055em;box-shadow:inset 0 -1px 0 rgba(40,52,65,.08);
    }
    td{transition:background .14s ease,transform .14s ease}
    tbody tr:nth-child(even) td{background:rgba(248,250,252,.56)}
    tbody tr:hover td{background:#fff7f3!important}
    tbody tr:hover td:first-child{box-shadow:inset 3px 0 0 var(--spx-primary)}
    .badge{
      padding:4px 7px;border-radius:8px;
      background:linear-gradient(135deg,#fff0ec,#fff7f4);
      color:#c9482c;border:1px solid #ffd9cf;
    }
    .age{border:1px solid rgba(55,65,81,.08);background:#f7f8fa}
    .pager{height:50px;background:rgba(255,255,255,.74);border-radius:0 0 18px 18px}
    .pager button{transition:all .15s ease}
    .pager button:hover{border-color:#ffc8bb;background:#fff4f0;color:#cf4d31}

    .delivery-layout{gap:14px}
    .delivery-form{padding:16px;gap:14px}
    .delivery-flow{
      height:46px;border-radius:12px;border-color:rgba(118,87,255,.18);
      background:linear-gradient(135deg,rgba(118,87,255,.055),rgba(24,183,201,.045));
      color:#637080;
    }
    .task-chip{
      padding:6px 10px;background:linear-gradient(135deg,#fff0ec,#fff7f4);
      border:1px solid #ffd9cf;
    }
    .delivery-result-head{padding:13px 16px}
    .delivery-table thead th{
      background:linear-gradient(135deg,#16a76d,#1abf84);
      box-shadow:inset 0 -1px 0 rgba(0,0,0,.08);
    }
    .delivery-table tbody tr{transition:filter .14s ease,transform .14s ease}
    .delivery-table tbody tr:hover{filter:saturate(1.06);transform:translateY(-1px)}
    .delivery-table tr.rank-first td{background:linear-gradient(90deg,#fff7a8,#fff26d)}
    .delivery-table tr.rank-second td{background:linear-gradient(90deg,#fff7e8,#ffefd3)}
    .delivery-table tr.rank-third td{background:linear-gradient(90deg,#fbe6df,#f8d8cc)}
    .delivery-table tr.rank-zero td{background:linear-gradient(90deg,#f1fbea,#e9f8e1)}
    .delivery-table tfoot th{background:linear-gradient(135deg,#e6f7fb,#d7f0f6)}

    .preview-backdrop{
      background:rgba(15,23,42,.72);
      backdrop-filter:blur(12px) saturate(120%);
      -webkit-backdrop-filter:blur(12px) saturate(120%);
      animation:spxFadeUp .18s ease both;
    }
    .preview-modal{
      border-radius:20px;box-shadow:var(--spx-shadow-lg);
      border:1px solid rgba(255,255,255,.5);
    }
    .preview-head{background:linear-gradient(180deg,#fff,#f9fafb)}
    .preview-scroll{background:radial-gradient(circle at 50% 0%,#3a4250,#242930 62%)}
    .preview-scroll img{border-radius:8px;box-shadow:0 18px 50px rgba(0,0,0,.36)}

    .seatalk-config{
      background:linear-gradient(135deg,rgba(238,245,255,.92),rgba(247,250,255,.92))!important;
      border-color:rgba(71,118,190,.16)!important;
      box-shadow:0 10px 30px rgba(36,89,169,.06);
    }
    .seatalk-send{
      background:linear-gradient(135deg,#edf5ff,#e8f0ff)!important;
      border-color:#c8d9f4!important;color:#285da9!important;
    }
    .seatalk-send:hover:not(:disabled){background:linear-gradient(135deg,#dfeeff,#e9f2ff)!important;box-shadow:0 8px 18px rgba(36,89,169,.12)}

    .stat-strip,.delivery-kpis{
      display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:12px 14px;
      border-bottom:1px solid rgba(31,41,55,.07);
    }
    .stat-card{
      min-height:72px;padding:12px;border-radius:14px;border:1px solid rgba(31,41,55,.07);
      background:linear-gradient(145deg,rgba(255,255,255,.96),rgba(249,250,252,.92));
      box-shadow:0 7px 20px rgba(31,41,55,.045);position:relative;overflow:hidden;
    }
    .stat-card::after{content:"";position:absolute;right:-18px;top:-22px;width:70px;height:70px;border-radius:50%;background:var(--stat-color,rgba(238,77,45,.08))}
    .stat-label{font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#7d8793;font-weight:900}
    .stat-value{margin-top:6px;font-size:21px;line-height:1;font-weight:950;color:#26313d;letter-spacing:-.03em}
    .stat-note{margin-top:4px;font-size:9px;color:#87919c}
    .stat-orange{--stat-color:rgba(238,77,45,.12)}
    .stat-purple{--stat-color:rgba(118,87,255,.12)}
    .stat-green{--stat-color:rgba(23,166,115,.12)}
    .stat-amber{--stat-color:rgba(244,165,28,.14)}

    @media(max-width:1100px){
      .query{grid-template-columns:minmax(180px,1fr) 24px minmax(180px,1fr);}
      .query .field:nth-of-type(3){grid-column:1/-1}
      .query .primary{grid-column:1/-1}
      .tools{grid-template-columns:1fr 180px}
      .tools .select:last-child{grid-column:1/-1}
      .stat-strip,.delivery-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
    }
    @media(max-width:720px){
      .header{height:66px;flex-basis:66px;padding:0 12px}
      .logo{width:38px;height:38px;border-radius:12px}
      .title{font-size:15px}.sub{display:none}
      .session-pill{display:none}.version-pill{height:30px;padding:0 9px}
      .main{padding:10px;gap:10px}
      .tabs{width:100%;display:grid;grid-template-columns:1fr 1fr;position:relative}
      .tab{min-width:0;width:100%;padding:0 8px;font-size:9.5px}
      .card,.delivery-result{border-radius:15px}
      .query,.tools,.delivery-form{grid-template-columns:1fr!important;padding:12px}
      .arrow{height:14px}
      .stat-strip,.delivery-kpis{grid-template-columns:1fr 1fr;padding:10px}
      .stat-card{min-height:66px;padding:10px}.stat-value{font-size:18px}
      .delivery-actions{width:100%;display:grid;grid-template-columns:1fr 1fr}
      .delivery-actions .ghostbtn{width:100%}
      .preview-backdrop{padding:8px}.preview-modal{width:100%;height:96vh;border-radius:14px}
    }
    @media(max-width:460px){
      .header-actions .version-pill{display:none}
      .stat-strip,.delivery-kpis{grid-template-columns:1fr}
      .delivery-actions{grid-template-columns:1fr}
      .tabs{grid-template-columns:1fr}
    }
  `;
  shadow.appendChild(modernStyle);

  const root = document.createElement("div");
  shadow.appendChild(root);

  function appHeaderHtml() {
    return `<header class="header">
      <div class="brand">
        <div class="logo">▦</div>
        <div>
          <div class="title">SPX Operations Tools</div>
          <div class="sub">Workspace vận hành · chạy trực tiếp bằng session SPX hiện tại</div>
        </div>
      </div>
      <div class="header-actions">
        <div class="session-pill"><span class="session-dot"></span><span>${state.bridgeReady ? "SPX Connected" : "Connecting..."}</span></div>
        <div class="version-pill">v1.5.0</div>
        <button class="close" data-close title="Đóng SPX Tools">×</button>
      </div>
    </header>`;
  }

  function tabsHtml() {
    return `<nav class="tabs" aria-label="SPX Operations Tools">
      <button class="tab ${state.activeTab === "fms" ? "active" : ""}" data-tab="fms">⌁ &nbsp; FMS Audit</button>
      <button class="tab ${state.activeTab === "delivery" ? "active" : ""}" data-tab="delivery">◫ &nbsp; Delivery Performance</button>
    </nav>`;
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;
  
    for (let i = 0; i < String(text || "").length; i += 1) {
      const ch = text[i];
  
      if (quoted) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            value += '"';
            i += 1;
          } else {
            quoted = false;
          }
        } else {
          value += ch;
        }
        continue;
      }
  
      if (ch === '"') {
        quoted = true;
        continue;
      }
  
      if (ch === ",") {
        row.push(value);
        value = "";
        continue;
      }
  
      if (ch === "\n") {
        row.push(value.replace(/\r$/, ""));
        rows.push(row);
        row = [];
        value = "";
        continue;
      }
  
      value += ch;
    }
  
    if (value.length || row.length) {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
    }
  
    if (!rows.length) return [];
  
    const headers = rows[0].map((h) => String(h || "").trim());
  
    return rows.slice(1)
      .filter((r) => r.some((cell) => String(cell || "").trim() !== ""))
      .map((r) => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = r[index] == null ? "" : r[index];
        });
        return obj;
      });
  }

  function parseMetricNumber(value) {
    const cleaned = String(value == null ? "" : value)
      .replace(/,/g, "")
      .replace(/%/g, "")
      .trim();
  
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : 0;
  }

  function buildDeliveryReport(csvText) {
    const raw = parseCsv(csvText);
  
    const ASSIGNED = "Number of Delivery Parcels Assigned (VN) with all Exclusions";
    const DELIVERED = "Number of Parcels Delivered (VN) with all Exclusions";
    const DELAY = "Number of Parcels Onhold (VN) with all Exclusions";
    const RATE = "Delivery Success Rate (VN) with all Exclusions";
  
    const rows = raw.map((item) => {
      const assigned = parseMetricNumber(item[ASSIGNED]);
      const delivered = parseMetricNumber(item[DELIVERED]);
      const delay = parseMetricNumber(item[DELAY]);
  
      let rate = parseMetricNumber(item[RATE]);
      if (!String(item[RATE] || "").trim() && assigned > 0) {
        rate = delivered / assigned * 100;
      }
  
      return {
        driver:String(item.Driver || "").trim(),
        assigned,
        delivered,
        delay,
        rate
      };
    }).filter((item) =>
      item.driver &&
      (
        item.assigned > 0 ||
        item.delivered > 0 ||
        item.delay > 0 ||
        item.rate > 0
      )
    );
  
    rows.sort((a, b) =>
      b.rate - a.rate ||
      b.delivered - a.delivered ||
      b.assigned - a.assigned ||
      a.driver.localeCompare(b.driver)
    );
  
    let previousRate = null;
    let previousRank = 0;
  
    rows.forEach((item, index) => {
      if (previousRate === null || Math.abs(item.rate - previousRate) > 0.000001) {
        previousRank = index + 1;
        previousRate = item.rate;
      }
      item.rank = previousRank;
    });
  
    const totals = rows.reduce((acc, item) => {
      acc.assigned += item.assigned;
      acc.delivered += item.delivered;
      acc.delay += item.delay;
      return acc;
    }, {assigned:0, delivered:0, delay:0});
  
    totals.rate = totals.assigned > 0
      ? totals.delivered / totals.assigned * 100
      : 0;
  
    return {rows, totals};
  }

  function formatVietnameseReportDate(value) {
    const parts = String(value || "").split("-");
    if (parts.length !== 3) return value || "";
    return "Ngày " + parts[2] + " Tháng " + parts[1] + " Năm " + parts[0];
  }

  function requestDeliveryExport() {
    if (state.delivery.loading) return;
  
    const date = String(state.delivery.startDate || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      state.delivery.error = "Vui lòng chọn ngày hợp lệ.";
      render();
      return;
    }
  
    state.delivery.loading = true;
    state.delivery.error = "";
    state.delivery.progress = "Đang tạo export task...";
    state.delivery.requestId =
      Date.now() + "_delivery_" + Math.random().toString(36).slice(2);
    state.delivery.taskId = 0;
    state.delivery.stationName = "";
    state.delivery.fileName = "";
    state.delivery.csvText = "";
    state.delivery.rows = [];
    state.delivery.totals = null;
    state.delivery.previewDataUrl = "";
    state.delivery.previewOpen = false;
  
    render();
  
    post("SPX_DELIVERY_EXPORT_RUN", {
      requestId:state.delivery.requestId,
      startDate:date
    });
  }

  function cancelDeliveryExport() {
    if (!state.delivery.loading) return;
    post("SPX_DELIVERY_EXPORT_CANCEL", {
      requestId:state.delivery.requestId
    });
  }

  function deliveryTableHtml() {
    const d = state.delivery;
  
    if (!d.rows.length) {
      return `<div class="delivery-empty">
        <div class="delivery-empty-icon">⇩</div>
        <b>Chưa có Delivery Performance</b>
        <div>Chọn ngày rồi nhấn <strong>Export & xử lý báo cáo</strong>.</div>
      </div>`;
    }
  
    const body = d.rows.map((row, index) => {
      const cls =
        row.rank === 1 ? "rank-first" :
        row.rank === 2 ? "rank-second" :
        row.rank === 3 ? "rank-third" :
        row.assigned === 0 ? "rank-zero" : "";
  
      return `<tr class="${cls}">
        <td class="driver">${esc(row.driver)}</td>
        <td>${row.assigned.toLocaleString("en-US")}</td>
        <td>${row.delivered.toLocaleString("en-US")}</td>
        <td>${row.delay.toLocaleString("en-US")}</td>
        <td><b>${row.rate.toFixed(1)}%</b></td>
        <td><b>${row.rank}</b></td>
      </tr>`;
    }).join("");
  
    const t = d.totals || {assigned:0,delivered:0,delay:0,rate:0};
  
    return `<section class="delivery-result">
      <div class="delivery-kpis">
        <div class="stat-card stat-orange"><div class="stat-label">Drivers</div><div class="stat-value">${d.rows.length.toLocaleString("en-US")}</div><div class="stat-note">Nhân sự trong report</div></div>
        <div class="stat-card stat-purple"><div class="stat-label">Đơn Nhận</div><div class="stat-value">${t.assigned.toLocaleString("en-US")}</div><div class="stat-note">Assigned parcels</div></div>
        <div class="stat-card stat-green"><div class="stat-label">Giao Thành Công</div><div class="stat-value">${t.delivered.toLocaleString("en-US")}</div><div class="stat-note">${t.rate.toFixed(2)}% success rate</div></div>
        <div class="stat-card stat-amber"><div class="stat-label">Delay</div><div class="stat-value">${t.delay.toLocaleString("en-US")}</div><div class="stat-note">On-hold parcels</div></div>
      </div>
      <div class="delivery-result-head">
        <div>
          <div class="cardtitle">Delivery Performance Report</div>
          <div class="hint">${esc(d.stationName || "Station")} · ${esc(formatVietnameseReportDate(d.startDate))}</div>
        </div>
        <div class="delivery-actions">
          <button class="ghostbtn" data-delivery-preview>▣ Preview JPG</button>
          <button class="ghostbtn" data-delivery-download-jpg>↓ Tải JPG</button>
        </div>
      </div>
      <div class="delivery-table-wrap">
        <table class="delivery-table">
          <thead><tr>
            <th>Driver</th>
            <th>Đơn Nhận</th>
            <th>Đơn Giao TC</th>
            <th>Delay</th>
            <th>Tỷ Lệ GTC</th>
            <th>Xếp Hạng</th>
          </tr></thead>
          <tbody>${body}</tbody>
          <tfoot><tr>
            <th>Total :</th>
            <th>${t.assigned.toLocaleString("en-US")}</th>
            <th>${t.delivered.toLocaleString("en-US")}</th>
            <th>${t.delay.toLocaleString("en-US")}</th>
            <th>${t.rate.toFixed(2)}%</th>
            <th></th>
          </tr></tfoot>
        </table>
      </div>
    </section>`;
  }

  function renderDeliveryTab() {
    const d = state.delivery;
  
    return `<section class="delivery-layout">
      <section class="card delivery-control">
        <div class="cardhead">
          <div>
            <div class="cardtitle">Export Delivery Performance</div>
            <div class="hint">Tạo task → dò task_id → tải CSV → xử lý report trong RAM.</div>
          </div>
          ${d.taskId ? `<span class="task-chip">Task #${d.taskId}</span>` : ""}
        </div>
  
        <div class="delivery-form">
          <div class="field">
            <label class="label">Start Date</label>
            <input class="input" type="date" data-delivery-date value="${esc(d.startDate)}" ${d.loading ? "disabled" : ""}>
          </div>
  
          <div class="delivery-flow">
            <span>1. Create task</span><b>→</b>
            <span>2. Wait export</span><b>→</b>
            <span>3. Download CSV</span><b>→</b>
            <span>4. Build report</span>
          </div>
  
          <div class="delivery-form-actions">
            ${d.loading ? `<button class="ghostbtn" data-delivery-cancel>Hủy</button>` : ""}
            <button class="primary delivery-run" data-delivery-run ${d.loading || !state.bridgeReady ? "disabled" : ""}>
              ${d.loading ? "Đang xử lý..." : "⇩ Export & xử lý báo cáo"}
            </button>
          </div>
        </div>
      </section>
  
      ${d.progress ? `<div class="progress">${esc(d.progress)}</div>` : ""}
      ${d.error ? `<div class="error">${esc(d.error)}</div>` : ""}
  
      ${deliveryTableHtml()}
    </section>`;
  }

  function createDeliveryJpegPreview() {
    const d = state.delivery;
    if (!d.rows.length || !d.totals) return "";
  
    const width = 1400;
    const titleH = 58;
    const dateH = 46;
    const headerH = 46;
    const rowH = 42;
    const totalH = 46;
    const height = titleH + dateH + headerH + d.rows.length * rowH + totalH;
  
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
  
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.textBaseline = "middle";
  
    const cols = [0, 520, 710, 900, 1060, 1240, 1400];
  
    function cell(x1, x2, y, h, fill, text, align, bold, size) {
      ctx.fillStyle = fill;
      ctx.fillRect(x1, y, x2 - x1, h);
      ctx.strokeStyle = "#8a9aa0";
      ctx.lineWidth = 1;
      ctx.strokeRect(x1 + .5, y + .5, x2 - x1 - 1, h - 1);
  
      ctx.fillStyle = "#111827";
      ctx.font = (bold ? "700 " : "500 ") + (size || 22) + "px Arial";
      ctx.textAlign = align || "center";
  
      const pad = 14;
      const x =
        align === "left" ? x1 + pad :
        align === "right" ? x2 - pad :
        (x1 + x2) / 2;
  
      ctx.fillText(String(text), x, y + h / 2);
    }
  
    cell(0, 700, 0, titleH, "#e7f5f8",
      "DELIVERY " + String(d.stationName || "PLEIKU 03 HUB").toUpperCase(),
      "center", true, 25);
  
    cell(700, 1400, 0, titleH, "#e7f5f8",
      formatVietnameseReportDate(d.startDate),
      "center", true, 23);
  
    const headers = ["Driver","Đơn Nhận","Đơn Giao TC","Delay","Tỷ Lệ GTC","Xếp Hạng"];
    for (let i = 0; i < 6; i += 1) {
      cell(cols[i], cols[i+1], titleH, dateH + headerH, "#18a957",
        headers[i], i === 0 ? "center" : "center", true, 21);
    }
  
    let y = titleH + dateH + headerH;
  
    d.rows.forEach((row, index) => {
      let fill = index % 2 ? "#ffffff" : "#f8fafc";
      if (row.rank === 1) fill = "#fff200";
      else if (row.rank === 2) fill = "#fff3dc";
      else if (row.rank === 3) fill = "#f8ded3";
      else if (row.assigned === 0) fill = "#effbea";
  
      const values = [
        row.driver,
        row.assigned,
        row.delivered,
        row.delay,
        row.rate.toFixed(1) + "%",
        row.rank
      ];
  
      for (let i = 0; i < 6; i += 1) {
        cell(cols[i], cols[i+1], y, rowH, fill, values[i],
          i === 0 ? "left" : "center", row.rank <= 3, 20);
      }
      y += rowH;
    });
  
    const t = d.totals;
    const totalValues = [
      "Total :",
      t.assigned,
      t.delivered,
      t.delay,
      t.rate.toFixed(2) + "%",
      ""
    ];
  
    for (let i = 0; i < 6; i += 1) {
      cell(cols[i], cols[i+1], y, totalH, "#dff4fa",
        totalValues[i], i === 0 ? "right" : "center", true, 22);
    }
  
    return canvas.toDataURL("image/jpeg", .95);
  }

  function renderDeliveryPreviewModal() {
    const d = state.delivery;
    if (!d.previewOpen || !d.previewDataUrl) return "";
  
    return `<div class="preview-backdrop" data-preview-close>
      <div class="preview-modal" data-preview-panel>
        <div class="preview-head">
          <div>
            <b>Preview Delivery Performance JPG</b>
            <div class="hint">${esc(d.stationName)} · ${esc(d.startDate)}</div>
          </div>
          <button class="close" data-preview-close>×</button>
        </div>
        <div class="preview-scroll">
          <img src="${d.previewDataUrl}" alt="Delivery Performance Preview">
        </div>
      </div>
    </div>`;
  }

  function pickerHtml() {
    if (!state.picker) return "";
    return `<div class="pop">
      <label class="opt"><input type="checkbox" data-all ${state.selectedStatuses.length===0?"checked":""}><span>Tất cả trạng thái</span></label>
      ${STATUSES.map(x => `<label class="opt"><input type="checkbox" data-status="${esc(x.code)}" ${state.selectedStatuses.includes(String(x.code))?"checked":""}><span>${esc(x.name)}</span><b>${esc(x.code)}</b></label>`).join("")}
    </div>`;
  }

  function tableHtml() {
    if (!state.rows.length) return `<div class="empty"><b>Chưa có dữ liệu FMS</b><br>Chọn điều kiện rồi nhấn Tải dữ liệu.</div>`;
    const rows = filteredRows();
    const pages = Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
    state.page = Math.min(Math.max(1,state.page),pages);
    const start = (state.page-1)*PAGE_SIZE;
    const view = rows.slice(start,start+PAGE_SIZE);
    const agingUnder24 = rows.filter(row => aging(row.latest?.timestamp) === "< 24H").length;
    const aging24to36 = rows.filter(row => aging(row.latest?.timestamp) === "24H → 36H").length;
    const agingOver36 = rows.filter(row => aging(row.latest?.timestamp) === "> 36H").length;

    return `<section class="card">
      <div class="stat-strip">
        <div class="stat-card stat-orange"><div class="stat-label">Kết quả</div><div class="stat-value">${rows.length}</div><div class="stat-note">Đơn sau bộ lọc</div></div>
        <div class="stat-card stat-green"><div class="stat-label">&lt; 24H</div><div class="stat-value">${agingUnder24}</div><div class="stat-note">Trong ngưỡng mới</div></div>
        <div class="stat-card stat-amber"><div class="stat-label">24H → 36H</div><div class="stat-value">${aging24to36}</div><div class="stat-note">Cần theo dõi</div></div>
        <div class="stat-card stat-purple"><div class="stat-label">&gt; 36H</div><div class="stat-value">${agingOver36}</div><div class="stat-note">Ưu tiên xử lý</div></div>
      </div>
      <div class="cardhead"><div><div class="cardtitle">Kết quả đã tải</div><div class="hint">Bộ lọc dưới đây không gọi lại API.</div></div><b>${rows.length} kết quả</b></div>
      <div class="tools">
        <input class="input" data-search placeholder="Tìm SPX, TO, Order Status, Station..." value="${esc(state.search)}">
        <select class="select" data-aging>
          <option value="ALL">Tất cả Aging</option>
          <option value="< 24H" ${state.aging==="< 24H"?"selected":""}>&lt; 24H</option>
          <option value="24H → 36H" ${state.aging==="24H → 36H"?"selected":""}>24H → 36H</option>
          <option value="> 36H" ${state.aging==="> 36H"?"selected":""}>&gt; 36H</option>
        </select>
        <select class="select" data-order-status>
          <option value="ALL">Tất cả Order Status đã tải</option>
          ${resultStatuses().map(c=>`<option value="${esc(c)}" ${state.orderStatus===c?"selected":""}>${esc(c)} · ${esc(statusName(c))}</option>`).join("")}
        </select>
      </div>
      <div class="meta"><span>${esc(state.applied?.current||"")} → ${esc(state.applied?.next||"")}</span><span>${state.applied?.statuses?.length||"Tất cả"} Order Status</span></div>
      <div class="tablewrap"><table><thead><tr><th>SPX Tracking Number</th><th>TO Number</th><th>Order Status</th><th>Current Station</th><th>Next Station</th><th>Tracking cuối</th><th>Cập nhật cuối</th><th>Đã qua</th><th>Aging</th></tr></thead>
      <tbody>${view.map(row=>`<tr>
        <td class="mono">${esc(row.shipmentId)}</td><td class="mono">${esc(row.to||"—")}</td>
        <td><span class="badge">${esc(row.orderStatus||"—")}</span><div class="small">${esc(statusName(row.orderStatus))}</div></td>
        <td>${esc(row.current||"—")}</td><td>${esc(row.next||"—")}</td>
        <td><span class="badge">${esc(row.latest?.status||"—")}</span><div class="small">${esc(row.latest?.message||"—")}</div></td>
        <td>${esc(dateTime(row.latest?.timestamp))}</td><td><b>${esc(elapsed(row.latest?.timestamp))}</b></td><td><span class="age">${esc(aging(row.latest?.timestamp))}</span></td>
      </tr>`).join("")}</tbody></table></div>
      <div class="pager"><span>${rows.length?start+1:0}-${Math.min(start+PAGE_SIZE,rows.length)} / ${rows.length}</span><span><button data-prev>← Trước</button> &nbsp; Trang ${state.page}/${pages} &nbsp; <button data-next>Sau →</button></span></div>
    </section>`;
  }

  function render() {
    if (!state.open) {
      root.innerHTML = `<button class="launch" data-open>✦ &nbsp; SPX Tools</button>`;
      return;
    }
    if (state.activeTab === "delivery") {
      root.innerHTML = `<div class="app">
        ${appHeaderHtml()}
        <main class="main">
          ${tabsHtml()}
          ${renderDeliveryTab()}
        </main>
        ${renderDeliveryPreviewModal()}
      </div>`;
      return;
    }

    root.innerHTML = `<div class="app">
      ${appHeaderHtml()}
      <main class="main">
        ${tabsHtml()}
        <section class="card">
          <div class="cardhead"><div><div class="cardtitle">Điều kiện tải dữ liệu</div><div class="hint">Đổi filter không tự request.</div></div><span>${state.selectedStatuses.length?state.selectedStatuses.length+" status":"Tất cả status"}</span></div>
          <div class="query">
            <div class="field"><label class="label">Current Station</label><select class="select" data-current><option value="1030" ${state.currentStation==="1030"?"selected":""}>1030 - Pleiku SOC</option><option value="1812" ${state.currentStation==="1812"?"selected":""}>1812 - Pleiku 03 Hub</option></select></div>
            <div class="arrow">→</div>
            <div class="field"><label class="label">Next Station</label><select class="select" data-next><option value="1030" ${state.nextStation==="1030"?"selected":""}>1030 - Pleiku SOC</option><option value="1812" ${state.nextStation==="1812"?"selected":""}>1812 - Pleiku 03 Hub</option></select></div>
            <div class="field"><label class="label">Order Status cần lấy</label><button class="pick" data-picker>${state.selectedStatuses.length?state.selectedStatuses.length+" trạng thái đã chọn":"Tất cả trạng thái"} ▾</button>${pickerHtml()}</div>
            <button class="primary" data-load ${state.loading||!state.bridgeReady?"disabled":""}>${state.loading?"Đang tải...":"↻ Tải dữ liệu"}</button>
          </div>
        </section>
        ${state.progress?`<div class="progress">${esc(state.progress)}</div>`:""}
        ${state.error?`<div class="error">${esc(state.error)}</div>`:""}
        ${tableHtml()}
      </main>
    </div>`;
  }

  window.addEventListener("message", event => {
    if (event.source !== window) return;
    const d = event.data;
    if (!d || d.source !== "SPX_FMS_AUDIT_BRIDGE") return;

    if (d.type === "SPX_FMS_BRIDGE_READY") { state.bridgeReady=true; render(); return; }

    if (String(d.type || "").startsWith("SPX_DELIVERY_EXPORT_")) {
      if (d.requestId && d.requestId !== state.delivery.requestId) return;

      if (d.type === "SPX_DELIVERY_EXPORT_PROGRESS") {
        if (d.stage === "create") {
          state.delivery.progress = "Đang tạo export task cho " + (d.startDate || state.delivery.startDate) + "...";
        } else if (d.stage === "task-created") {
          state.delivery.taskId = Number(d.taskId || 0);
          state.delivery.progress = "Đã tạo task #" + state.delivery.taskId + " · đang chờ SPX tạo file...";
        } else if (d.stage === "poll") {
          state.delivery.progress = "Đang chờ file export · lần kiểm tra " + (d.attempt || 0) + "/" + (d.maxAttempts || 60);
        } else if (d.stage === "download") {
          state.delivery.progress = "File đã sẵn sàng · đang tải CSV vào bộ nhớ tạm...";
        }
        render();
        return;
      }

      if (d.type === "SPX_DELIVERY_EXPORT_RESULT") {
        const result = d.result || {};
        const report = buildDeliveryReport(result.csv_text || "");

        state.delivery.loading = false;
        state.delivery.progress = "";
        state.delivery.error = "";
        state.delivery.taskId = Number(result.task_id || 0);
        state.delivery.stationName = String(result.station_name || "44-GLI Pleiku 03 Hub");
        state.delivery.fileName = String(result.file_name || "");
        state.delivery.csvText = String(result.csv_text || "");
        state.delivery.rows = report.rows;
        state.delivery.totals = report.totals;
        state.delivery.previewDataUrl = "";
        state.delivery.previewOpen = false;
        render();
        return;
      }

      if (d.type === "SPX_DELIVERY_EXPORT_ERROR") {
        state.delivery.loading = false;
        state.delivery.progress = "";
        state.delivery.error = String(d.message || "Không thể export Delivery Performance.");
        render();
        return;
      }

      if (d.type === "SPX_DELIVERY_EXPORT_CANCELLED") {
        state.delivery.loading = false;
        state.delivery.progress = "";
        render();
        return;
      }
    }

    if (d.requestId && d.requestId !== state.requestId) return;

    if (d.type === "SPX_FMS_PROGRESS") {
      if (d.stage==="search") state.progress=`Search: ${d.ordersFound||0}/${d.total||"?"} · ${d.pagesFetched||0} trang`;
      if (d.stage==="detail") state.progress=`Tracking detail: ${d.completed||0}/${d.total||0}`;
      render(); return;
    }
    if (d.type === "SPX_FMS_RESULT") {
      state.rows=normalizeRows(d.result?.rows); state.total=Math.max(Number(d.result?.total||0),state.rows.length);
      state.applied={current:stationName(state.currentStation),next:stationName(state.nextStation),statuses:state.selectedStatuses.slice()};
      state.loading=false; state.progress=""; state.error=""; state.orderStatus="ALL"; state.page=1; render(); return;
    }
    if (d.type === "SPX_FMS_ERROR") { state.loading=false; state.progress=""; state.error=String(d.message||"Không thể tải FMS."); render(); return; }
    if (d.type === "SPX_FMS_CANCELLED") { state.loading=false; state.progress=""; render(); }
  });

  shadow.addEventListener("click", e => {
    const t=e.target;
    if (t.matches("[data-open]")) { state.open=true; render(); return; }
    if (t.matches("[data-tab]")) { state.activeTab=t.dataset.tab || "fms"; state.picker=false; render(); return; }
    if (t.matches("[data-close]")) { state.open=false; render(); return; }
    if (t.matches("[data-picker]")) { state.picker=!state.picker; render(); return; }
    if (t.matches("[data-load]")) { state.picker=false; load(); return; }
    if (t.matches("[data-prev]")) { state.page=Math.max(1,state.page-1); render(); return; }
    if (t.matches("[data-next]")) { state.page++; render(); return; }

    if (t.matches("[data-delivery-run]")) { requestDeliveryExport(); return; }
    if (t.matches("[data-delivery-cancel]")) { cancelDeliveryExport(); return; }

    if (t.matches("[data-delivery-preview]")) {
      state.delivery.previewDataUrl = createDeliveryJpegPreview();
      state.delivery.previewOpen = Boolean(state.delivery.previewDataUrl);
      render();
      return;
    }

    if (t.matches("[data-delivery-download-jpg]")) {
      const dataUrl = state.delivery.previewDataUrl || createDeliveryJpegPreview();
      if (!dataUrl) return;

      state.delivery.previewDataUrl = dataUrl;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "delivery_performance_" + state.delivery.startDate + ".jpg";
      a.click();
      return;
    }

    if (t.matches("[data-preview-close]") && !t.closest("[data-preview-panel]")) {
      state.delivery.previewOpen = false;
      render();
      return;
    }

    if (t.matches("[data-preview-close]")) {
      state.delivery.previewOpen = false;
      render();
    }
  });

  shadow.addEventListener("change", e => {
    const t=e.target;
    if (t.matches("[data-delivery-date]")) { state.delivery.startDate=t.value; return; }
    if (t.matches("[data-current]")) { state.currentStation=t.value; render(); return; }
    if (t.matches("[data-next]")) { state.nextStation=t.value; render(); return; }
    if (t.matches("[data-all]")) { state.selectedStatuses=[]; render(); return; }
    if (t.matches("[data-status]")) {
      const c=String(t.dataset.status); const i=state.selectedStatuses.indexOf(c);
      if (t.checked && i<0) state.selectedStatuses.push(c);
      if (!t.checked && i>=0) state.selectedStatuses.splice(i,1);
      state.selectedStatuses.sort((a,b)=>Number(a)-Number(b)); render(); return;
    }
    if (t.matches("[data-aging]")) { state.aging=t.value; state.page=1; render(); return; }
    if (t.matches("[data-order-status]")) { state.orderStatus=t.value; state.page=1; render(); }
  });

  shadow.addEventListener("input", e => {
    if (!e.target.matches("[data-search]")) return;
    state.search=e.target.value; state.page=1;
    const pos=e.target.selectionStart; render();
    const n=shadow.querySelector("[data-search]"); if(n){n.focus();n.setSelectionRange(pos,pos);}
  });

  // SeaTalk delivery-report integration (v1.4.0)
  Object.assign(state.delivery, {
    seatalkWebhook: "",
    seatalkLoaded: false,
    seatalkSending: false,
    seatalkMessage: "",
    seatalkError: ""
  });

  function seatalkValidWebhook(value) {
    try {
      const url = new URL(String(value || "").trim());
      return url.protocol === "https:" &&
        url.hostname === "openapi.seatalk.io" &&
        url.pathname.startsWith("/webhook/group/");
    } catch (_) {
      return false;
    }
  }

  function seatalkLoadWebhook() {
    if (!globalThis.chrome?.storage?.local) {
      state.delivery.seatalkLoaded = true;
      return;
    }

    chrome.storage.local.get(["seatalkWebhook"], result => {
      state.delivery.seatalkWebhook = String(result?.seatalkWebhook || "");
      state.delivery.seatalkLoaded = true;
      render();
    });
  }

  function seatalkSaveWebhook() {
    const input = shadow.querySelector("[data-seatalk-webhook]");
    const value = String(input?.value || "").trim();

    state.delivery.seatalkMessage = "";
    state.delivery.seatalkError = "";

    if (!value) {
      seatalkClearWebhook();
      return;
    }

    if (!seatalkValidWebhook(value)) {
      state.delivery.seatalkError =
        "Webhook không hợp lệ. Chỉ chấp nhận https://openapi.seatalk.io/webhook/group/...";
      render();
      return;
    }

    chrome.storage.local.set({seatalkWebhook: value}, () => {
      if (chrome.runtime.lastError) {
        state.delivery.seatalkError = chrome.runtime.lastError.message;
      } else {
        state.delivery.seatalkWebhook = value;
        state.delivery.seatalkMessage = "✓ Đã lưu SeaTalk Webhook trên thiết bị này.";
      }
      render();
    });
  }

  function seatalkClearWebhook() {
    chrome.storage.local.remove("seatalkWebhook", () => {
      state.delivery.seatalkWebhook = "";
      state.delivery.seatalkError = "";
      state.delivery.seatalkMessage = "Đã xóa SeaTalk Webhook khỏi bộ nhớ local.";
      render();
    });
  }

  function seatalkSendDeliveryImage() {
    const d = state.delivery;
    if (d.seatalkSending) return;

    d.seatalkMessage = "";
    d.seatalkError = "";

    if (!seatalkValidWebhook(d.seatalkWebhook)) {
      d.seatalkError = "Hãy nhập và lưu SeaTalk Webhook trước khi gửi.";
      render();
      return;
    }

    const dataUrl = d.previewDataUrl || createDeliveryJpegPreview();
    if (!dataUrl) {
      d.seatalkError = "Chưa có Delivery Performance report để gửi.";
      render();
      return;
    }

    const base64 = String(dataUrl).split(",", 2)[1] || "";
    const encodedBytes = new TextEncoder().encode(base64).length;

    if (!base64 || encodedBytes > 5 * 1024 * 1024) {
      d.seatalkError = "Ảnh report vượt giới hạn 5MB Base64 của SeaTalk.";
      render();
      return;
    }

    d.previewDataUrl = dataUrl;
    d.seatalkSending = true;
    d.seatalkMessage = "Đang gửi ảnh report vào SeaTalk...";
    render();

    chrome.runtime.sendMessage({
      type: "SEATALK_SEND_IMAGE",
      webhook: d.seatalkWebhook,
      imageBase64: base64
    }, response => {
      d.seatalkSending = false;

      if (chrome.runtime.lastError) {
        d.seatalkMessage = "";
        d.seatalkError = chrome.runtime.lastError.message;
        render();
        return;
      }

      if (!response?.ok) {
        d.seatalkMessage = "";
        d.seatalkError = String(response?.error || "SeaTalk webhook gửi thất bại.");
        render();
        return;
      }

      d.seatalkError = "";
      d.seatalkMessage = "✓ Đã gửi ảnh Delivery Performance vào SeaTalk.";
      render();
    });
  }

  function seatalkEnsureStyles() {
    if (shadow.querySelector("#seatalk-addon-style")) return;

    const extraStyle = document.createElement("style");
    extraStyle.id = "seatalk-addon-style";
    extraStyle.textContent = [
      ".seatalk-config{margin:0 14px 14px;padding:12px;border:1px solid #dfe4e9;border-radius:11px;background:#f8fafb;display:grid;gap:8px}",
      ".seatalk-config-head{display:flex;align-items:center;justify-content:space-between;gap:10px}",
      ".seatalk-config-title{font-size:10.5px;font-weight:900;color:#374151}",
      ".seatalk-local{font-size:9px;color:#76808b}",
      ".seatalk-row{display:grid;grid-template-columns:minmax(360px,1fr) auto auto;gap:8px;align-items:center}",
      ".seatalk-message{font-size:9.5px;font-weight:800;color:#167653}",
      ".seatalk-error{font-size:9.5px;font-weight:800;color:#a52b49}",
      ".seatalk-send{border-color:#bfd4f3!important;background:#eef5ff!important;color:#2459a9!important}",
      ".seatalk-send:disabled{opacity:.5;cursor:not-allowed}",
      "@media(max-width:900px){.seatalk-row{grid-template-columns:1fr}.seatalk-config-head{align-items:flex-start;flex-direction:column}}"
    ].join("");

    shadow.appendChild(extraStyle);
  }

  function seatalkEnhanceUI() {
    seatalkEnsureStyles();

    if (!state.open || state.activeTab !== "delivery") return;

    const form = shadow.querySelector(".delivery-form");
    if (form && !shadow.querySelector("[data-seatalk-config]")) {
      const config = document.createElement("div");
      config.className = "seatalk-config";
      config.setAttribute("data-seatalk-config", "");

      config.innerHTML = `
        <div class="seatalk-config-head">
          <div class="seatalk-config-title">SeaTalk Webhook</div>
          <div class="seatalk-local">Lưu bằng chrome.storage.local · chỉ trên extension này</div>
        </div>
        <div class="seatalk-row">
          <input
            class="input"
            type="password"
            autocomplete="off"
            spellcheck="false"
            data-seatalk-webhook
            placeholder="https://openapi.seatalk.io/webhook/group/..."
            value="${esc(state.delivery.seatalkWebhook)}"
          >
          <button class="ghostbtn" data-seatalk-save>Lưu webhook</button>
          <button class="ghostbtn" data-seatalk-clear ${state.delivery.seatalkWebhook ? "" : "disabled"}>Xóa</button>
        </div>
        ${state.delivery.seatalkMessage ? `<div class="seatalk-message">${esc(state.delivery.seatalkMessage)}</div>` : ""}
        ${state.delivery.seatalkError ? `<div class="seatalk-error">${esc(state.delivery.seatalkError)}</div>` : ""}
      `;

      form.insertAdjacentElement("afterend", config);
    }

    const previewButton = shadow.querySelector("[data-delivery-preview]");
    if (previewButton && !shadow.querySelector("[data-delivery-seatalk]")) {
      const sendButton = document.createElement("button");
      sendButton.className = "ghostbtn seatalk-send";
      sendButton.setAttribute("data-delivery-seatalk", "");
      sendButton.disabled = !state.delivery.seatalkWebhook || state.delivery.seatalkSending;
      sendButton.textContent = state.delivery.seatalkSending ? "Đang gửi..." : "↗ Gửi SeaTalk";
      previewButton.insertAdjacentElement("afterend", sendButton);
    }
  }

  const seatalkBaseRender = render;
  render = function () {
    seatalkBaseRender();
    seatalkEnhanceUI();
  };

  shadow.addEventListener("click", event => {
    const target = event.target.closest(
      "[data-seatalk-save],[data-seatalk-clear],[data-delivery-seatalk]"
    );

    if (!target) return;

    if (target.matches("[data-seatalk-save]")) {
      seatalkSaveWebhook();
      return;
    }

    if (target.matches("[data-seatalk-clear]")) {
      seatalkClearWebhook();
      return;
    }

    if (target.matches("[data-delivery-seatalk]")) {
      seatalkSendDeliveryImage();
    }
  });

  render();
  seatalkLoadWebhook();
  post("SPX_FMS_PING");
})();