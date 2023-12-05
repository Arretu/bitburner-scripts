/** @param {NS} ns */
export async function main(ns) {

	const target = ns.args[0];

	while (true) {
		if (ns.getServerSecurityLevel(target) != ns.getServerMinSecurityLevel(target)) {
			await ns.weaken(target);
		}
		else if (ns.getServerMaxMoney(target) != ns.getServerMoneyAvailable(target)) {
			await ns.grow(target);
		}
		else if (ns.getServerSecurityLevel(target) != ns.getServerMinSecurityLevel(target)) {
			await ns.weaken(target);
		}
		else {
			await ns.hack(target);
		}
		await ns.sleep(20);
	}
}