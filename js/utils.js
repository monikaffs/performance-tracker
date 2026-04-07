// TOAST
export function showToast(msg){
  let toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = msg;

  document.body.appendChild(toast);

  setTimeout(()=> toast.classList.add("show"),100);

  setTimeout(()=>{
    toast.classList.remove("show");
    setTimeout(()=> toast.remove(),300);
  },3000);
}

// LOADER
export function showLoader(container){
  container.innerHTML = `<div class="loader"></div>`;
}

// EMPTY STATE
export function showEmpty(container, text="No Data Found"){
  container.innerHTML = `<div class="empty">${text}</div>`;
}