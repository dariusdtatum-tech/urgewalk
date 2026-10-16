(function(){var d=document.documentElement;if(!d.classList.contains("js"))return;
var els=document.querySelectorAll("section .card, .steps li");
try{var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -5% 0px"});
els.forEach(function(el){io.observe(el)});}catch(err){d.classList.remove("js")}
setTimeout(function(){els.forEach(function(el){el.classList.add("in")})},4000);})();
