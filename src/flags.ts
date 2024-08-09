let featureflags = new URLSearchParams(location.search.slice(1))
console.log({featureflags})
for (let [flag, value] of featureflags.entries()) {
	document.body.setAttribute(flag, value)
}
export default featureflags
