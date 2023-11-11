/** @param {NS} ns */
export async function main(ns) {

	let target = ns.args[0];
	let secThresh = ns.args[1];
	let monThresh = ns.args[2];

	while (true) {

		if (ns.getServerSecurityLevel(target) > secThresh) {
			await ns.weaken(target);
		}

		else if (ns.getServerMoneyAvailable(target) < monThresh) {
			await ns.grow(target);
		}

		else {
			await ns.hack(target);
		}
	}
}