/** @param {NS} ns */
export async function main(ns) {

	let target = ns.args[0];
	let sleep = ns.args[1];
	let randArg = ns.args[3];

	await ns.sleep(sleep);
	await ns.grow(target);

}