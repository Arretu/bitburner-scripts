/** @param {NS} ns */
export async function main(ns) {
	const time = ns.args[0];
	const target = ns.args[1];
	const batchID = ns.args[2];
	const port = ns.args[3];


	ns.print(typeof (port));

	await ns.weaken(target, { additionalMsec: time });
	if (typeof(port) == "number") {
		const outPort = ns.getPortHandle(port);
		outPort.write(batchID);
		ns.print("DEBUG: WROTE ", batchID, "TO OUTPORT")
	}
}
