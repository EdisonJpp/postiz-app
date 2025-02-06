import React, { FC, Fragment, useCallback, useMemo, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import useSWR from 'swr';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { Button } from '@gitroom/react/form/button';
import { useModals } from '@mantine/modals';
import { TopTitle } from '@gitroom/frontend/components/launches/helpers/top.title.component';
import { Input } from '@gitroom/react/form/input';
import { FormProvider, useForm } from 'react-hook-form';
import { array, object, string } from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Select } from '@gitroom/react/form/select';
import { PickPlatforms } from '@gitroom/frontend/components/launches/helpers/pick.platform.component';
import { useToaster } from '@gitroom/react/toaster/toaster';
import clsx from 'clsx';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';

export const Webhooks: FC = () => {
  const fetch = useFetch();
  const user = useUser();
  const modal = useModals();
  const toaster = useToaster();

  const list = useCallback(async () => {
    return (await fetch('/webhooks')).json();
  }, []);

  const { data, mutate } = useSWR('webhooks', list);

  const addWebhook = useCallback(
    (data?: any) => () => {
      modal.openModal({
        title: '',
        withCloseButton: false,
        classNames: {
          modal: 'bg-transparent text-textColor',
        },
        children: <AddOrEditWebhook data={data} reload={mutate} />,
      });
    },
    []
  );

  const deleteHook = useCallback(
    (data: any) => async () => {
      if (await deleteDialog(`Are you sure you want to delete ${data.name}?`)) {
        await fetch(`/webhooks/${data.id}`, { method: 'DELETE' });
        mutate();
        toaster.show('Webhook deleted successfully', 'success');
      }
    },
    []
  );

  return (
    <div className="flex flex-col">
      <h3 className="text-[20px]">
        Webhooks ({data?.length || 0}/{user?.tier?.webhooks})
      </h3>
      <div className="text-customColor18 mt-[4px]">
        Webhooks are a way to get notified when something happens in Postiz via
        an HTTP request.
      </div>
      <div className="my-[16px] mt-[16px] bg-sixth border-fifth items-center border rounded-[4px] p-[24px] flex gap-[24px]">
        <div className="flex flex-col w-full">
          {!!data?.length && (
            <div className="grid grid-cols-[1fr,1fr,1fr,1fr] w-full gap-y-[10px]">
              <div>Name</div>
              <div>URL</div>
              <div>Edit</div>
              <div>Delete</div>
              {data?.map((p: any) => (
                <Fragment key={p.id}>
                  <div className="flex flex-col justify-center">{p.name}</div>
                  <div className="flex flex-col justify-center">{p.url}</div>
                  <div className="flex flex-col justify-center">
                    <div>
                      <Button onClick={addWebhook(p)}>Edit</Button>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <div>
                      <Button onClick={deleteHook(p)}>Delete</Button>
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
          )}
          <div>
            <Button
              onClick={addWebhook()}
              className={clsx((data?.length || 0) > 0 && 'my-[16px]')}
            >
              Add a webhook
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const details = object().shape({
  name: string().required(),
  url: string().url().required(),
  integrations: array(),
});

const options = [
  { label: 'All integrations', value: 'all' },
  { label: 'Specific integrations', value: 'specific' },
];

export const AddOrEditWebhook: FC<{ data?: any; reload: () => void }> = (
  props
) => {
  const { data, reload } = props;
  const fetch = useFetch();
  const [allIntegrations, setAllIntegrations] = useState(
    (data?.integrations?.length || 0) > 0 ? options[1] : options[0]
  );
  const modal = useModals();
  const toast = useToaster();
  const form = useForm({
    resolver: yupResolver(details),
    values: {
      name: data?.name || '',
      url: data?.url || '',
      integrations: data?.integrations?.map((p: any) => p.integration) || [],
    },
  });

  const integrations = form.watch('integrations');

  const integration = useCallback(async () => {
    return (await fetch('/integrations/list')).json();
  }, []);

  const changeIntegration = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const findValue = options.find(
        (option) => option.value === e.target.value
      )!;
      setAllIntegrations(findValue);
      if (findValue.value === 'all') {
        form.setValue('integrations', []);
      }
    },
    []
  );

  const { data: dataList, isLoading } = useSWR('integrations', integration);

  const callBack = useCallback(
    async (values: any) => {
      await fetch('/webhooks', {
        method: data?.id ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...(data?.id ? { id: data.id } : {}),
          ...values,
        }),
      });

      toast.show(
        data?.id
          ? 'Webhook updated successfully'
          : 'Webhook added successfully',
        'success'
      );

      modal.closeAll();
      reload();
    },
    [data, integrations]
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(callBack)}>
        <div className="relative flex gap-[20px] flex-col flex-1 rounded-[4px] border border-customColor6 bg-sixth p-[16px] pt-0 w-[500px]">
          <TopTitle title={data ? 'Edit webhook' : 'Add webhook'} />
          <button
            className="outline-none absolute right-[20px] top-[15px] mantine-UnstyledButton-root mantine-ActionIcon-root hover:bg-tableBorder cursor-pointer mantine-Modal-close mantine-1dcetaa"
            type="button"
            onClick={modal.closeAll}
          >
            <svg
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
            >
              <path
                d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>

          <div>
            <Input label="Name" {...form.register('name')} />
            <Input label="URL" {...form.register('url')} />
            <Select
              value={allIntegrations.value}
              name="integrations"
              label="Integrations"
              disableForm={true}
              onChange={changeIntegration}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {allIntegrations.value === 'specific' && dataList && !isLoading && (
              <PickPlatforms
                integrations={dataList.integrations}
                selectedIntegrations={integrations as any[]}
                onChange={(e) => form.setValue('integrations', e)}
                singleSelect={false}
                toolTip={true}
                isMain={true}
              />
            )}
            <Button
              type="submit"
              className="mt-[24px]"
              disabled={
                !form.formState.isValid ||
                (allIntegrations.value === 'specific' && !integrations?.length)
              }
            >
              Save
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
