import { requireCarer } from "@/lib/auth";
import { cultureState } from "@/lib/culture/data";
import { CULTURE_VIDEOS, cultureImg } from "@/lib/culture/videos";
import { CarerNav } from "../CarerNav";
import { CultureList } from "./CultureList";

export default async function Culture() {
  const me = await requireCarer();
  const done = await cultureState(me.id);
  const videos = CULTURE_VIDEOS.map((v) => ({ key: v.key, title: v.title, yt: v.yt, seconds: v.seconds, img: cultureImg(v.img) }));
  return (
    <div className="carer">
      <CarerNav on="policies" name={me.name} />
      <main className="culture">
        <h1>Culture of Care</h1>
        <p className="hint">Good care delivered by good people.</p>
        <CultureList videos={videos} done={done} viewAs={Boolean(me.viewAs)} />
      </main>
    </div>
  );
}
