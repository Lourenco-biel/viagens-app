"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/confirm-button";
import { errorMessage } from "@/lib/graphql/error-message";
import { SET_TRIP_BUDGET } from "../graphql/documents";
import { confirmedCost } from "../lib/trip-costs";
import type { TripDetail } from "../model/trip-detail";
import { BudgetDialog } from "./budget-dialog";
import { TripCostSummary } from "./trip-cost-summary";

export function TripBudget({ trip, refreshError }: { trip: TripDetail; refreshError?: string }) {
  const [save, { loading }] = useMutation(SET_TRIP_BUDGET);
  const [editor, setEditor] = useState<{ value: string | null } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const removing = useRef(false);
  const removalControls = useRef<HTMLDivElement>(null);
  const restoreTriggerFocus = useRef(false);
  const triggerId = useId();
  function restoreFocusIfReady() {
    const trigger = document.getElementById(triggerId);
    if (restoreTriggerFocus.current && trigger && !trigger.hasAttribute("disabled")) {
      trigger.focus();
      restoreTriggerFocus.current = false;
    }
  }
  // O Apollo pode concluir a promessa antes do commit que habilita o acionador.
  useEffect(restoreFocusIfReady);
  function focusTrigger() {
    restoreTriggerFocus.current = true;
    requestAnimationFrame(restoreFocusIfReady);
  }
  return (
    <div className="min-w-0 space-y-2">
      <TripCostSummary
        budget={trip.budgetPerPerson}
        total={confirmedCost(trip.activities)}
        actions={
          trip.isOwner && (
            <>
              <Button
                id={triggerId}
                variant="outline"
                disabled={loading || Boolean(editor)}
                onClick={() => {
                  setEditor({ value: trip.budgetPerPerson });
                  setError("");
                  setMessage("");
                }}
              >
                {trip.budgetPerPerson === null ? "Definir orçamento" : "Editar orçamento"}
              </Button>
              {trip.budgetPerPerson !== null && (
                <div
                  ref={removalControls}
                  onClickCapture={(event) => {
                    const label = (event.target as HTMLElement).closest("button")?.textContent;
                    if (label === "Cancelar") focusTrigger();
                    if (label === "Remover orçamento")
                      requestAnimationFrame(() =>
                        removalControls.current?.querySelector("button")?.focus(),
                      );
                  }}
                >
                  <ConfirmButton
                    label="Remover orçamento"
                    message="Remover o orçamento? Os passeios e seus custos serão preservados."
                    disabled={loading || Boolean(editor)}
                    onConfirm={async () => {
                      if (removing.current) return;
                      removing.current = true;
                      setError("");
                      setMessage("");
                      try {
                        await save({
                          variables: { id: trip.id, input: { budgetPerPerson: null } },
                        });
                        setMessage("Orçamento removido.");
                      } catch (cause) {
                        setError(errorMessage(cause));
                      } finally {
                        removing.current = false;
                        focusTrigger();
                      }
                    }}
                  />
                </div>
              )}
            </>
          )
        }
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {loading && !editor && (
        <p role="status" className="text-sm">
          Removendo orçamento…
        </p>
      )}
      {editor && (
        <BudgetDialog
          initialValue={editor.value}
          refreshError={refreshError}
          returnFocusId={triggerId}
          onCloseAction={() => setEditor(null)}
          onSaveAction={async (input) => {
            await save({ variables: { id: trip.id, input } });
            setMessage("Orçamento salvo.");
          }}
        />
      )}
    </div>
  );
}
