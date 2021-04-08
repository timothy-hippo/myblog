
let categoryCheck=document.querySelector('#categorycheck');

categoryCheck.addEventListener('change',function(){
  //console.log(categoryCheck.value);
  window.location='/'+categoryCheck.value
})