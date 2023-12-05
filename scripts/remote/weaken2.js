/** @param {NS} ns */
export async function main(ns) {
	const time = ns.args[0];
	const target = ns.args[1];
	const batchID = ns.args[2].toString();
	const port = ns.args[3];


	ns.print(batchID);

	await ns.weaken(target, { additionalMsec: time });
	if (typeof (port) == "number") {
		const listenPort = ns.getPortHandle(port);
		while (listenPort.full() == true) {
			ns.print(batchID, " forced to sleep.")
			await ns.sleep(20);
		}
		listenPort.write(batchID.toString());
	}
}
