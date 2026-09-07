import { memo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EditorActions } from "../hooks/useEditorState";
import type { EditableListKey, EditableStringItem } from "../types";
import { ReorderControls } from "./ReorderControls";

type RowProps = {
  dayIndex: number;
  listKey: EditableListKey;
  item: EditableStringItem;
  index: number;
  total: number;
  itemLabel: string;
  actions: EditorActions;
};

function StringListItemRowComponent({ dayIndex, listKey, item, index, total, itemLabel, actions }: RowProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Input
        value={item.value}
        onChange={(event) => actions.updateListItem(dayIndex, listKey, item.id, event.target.value)}
        aria-label={`${itemLabel} ${index + 1}`}
        className="flex-1"
      />
      <ReorderControls
        canMoveUp={index > 0}
        canMoveDown={index < total - 1}
        onMoveUp={() => actions.moveListItem(dayIndex, listKey, item.id, "up")}
        onMoveDown={() => actions.moveListItem(dayIndex, listKey, item.id, "down")}
        onRemove={() => actions.removeListItem(dayIndex, listKey, item.id)}
      />
    </div>
  );
}

const StringListItemRow = memo(StringListItemRowComponent);

type Props = {
  dayIndex: number;
  listKey: EditableListKey;
  items: EditableStringItem[];
  addLabel: string;
  emptyLabel: string;
  itemLabel: string;
  actions: EditorActions;
};

/** Editor genérico de listas de texto simples: recomendaciones y consejos. */
function StringListEditorComponent({ dayIndex, listKey, items, addLabel, emptyLabel, itemLabel, actions }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && <p className="text-xs text-muted-foreground">{emptyLabel}</p>}
      {items.map((item, index) => (
        <StringListItemRow
          key={item.id}
          dayIndex={dayIndex}
          listKey={listKey}
          item={item}
          index={index}
          total={items.length}
          itemLabel={itemLabel}
          actions={actions}
        />
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground hover:text-foreground"
        onClick={() => actions.addListItem(dayIndex, listKey)}
      >
        <Plus /> {addLabel}
      </Button>
    </div>
  );
}

export const StringListEditor = memo(StringListEditorComponent);
