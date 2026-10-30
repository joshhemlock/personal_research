import Link from "next/link";
import type { LinkedItem } from "@/lib/mock/notes";
import { Icon } from "@/components/ui/Icon";
import { LINK_ICONS } from "./constants";

/** Transcripts, statements, screens and notes this note refers to. */
export function LinkedItems({ items }: { items: LinkedItem[] }) {
  return (
    <section aria-labelledby="ln-h" className="glass rounded-[24px] px-[18px] pt-[14px] pb-2">
      <h2 id="ln-h" className="mb-1 text-[19px] font-normal">
        Linked
      </h2>
      <ul>
        {items.map((l) => (
          <li key={l.href + l.title}>
            {/* 42px rows plus the 1px top border (content-box in the design). */}
            <Link
              href={l.href}
              className="group flex min-h-[43px] items-center gap-[10px] border-t border-hairline text-ink"
            >
              <span className="inline-flex size-[30px] flex-none items-center justify-center rounded-[9px] bg-track text-ink-2 transition-colors duration-150 group-hover:bg-[rgba(17,17,19,0.08)]">
                <Icon d={LINK_ICONS[l.kind]} size={16} strokeWidth={1.7} linejoin="round" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col leading-[1.25]">
                <span className="text-[14px] group-hover:text-focus">{l.title}</span>
                <span className="text-[12px] text-muted">{l.meta}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
