export function shoot(send, onLocalShot) {
  if (onLocalShot) onLocalShot();
  if (send) send({t: "hit"});
}
