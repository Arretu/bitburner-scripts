/* Library of flag-related functions?
 * Not sure really.
 * For now, this is where I keep my hasFormulas check.
 * 
 * 
 * 
 * 
 * 
*/




/** @param {NS} ns */
export async function hasFormulas(ns) {
	let hasFormulasFlag = ns.fileExists("Formulas.exe","home");
	return hasFormulasFlag;
}
