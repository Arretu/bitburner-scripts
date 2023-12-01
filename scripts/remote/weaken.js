/** @param {NS} ns */
export async function main(ns) {
	let time = ns.args[0];
	let target = ns.args[1];
	await ns.weaken(target, { additionalMsec: time });
}
