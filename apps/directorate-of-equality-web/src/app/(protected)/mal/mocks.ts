import { type ColumnDef } from '@tanstack/react-table'

export type Case = {
  date: string
  category: string
  company: string
  ceo: string
  kennitala: string
  email: string
  isat: string
  ceoGender: string
  employees: number
}

export const MOCK_DATA: Case[] = [
  {
    date: '06.12.2025',
    category: 'Jafnréttisáætlun',
    company: 'Kallaklemma ehf.',
    ceo: 'Gunnar Gunnarsson',
    kennitala: '470301-1234',
    email: 'gunnar@kallaklemma.is',
    isat: '62010 Hugbúnaðargerð',
    ceoGender: 'Karl',
    employees: 32,
  },
  {
    date: '06.12.2025',
    category: 'Jafnréttisáætlun',
    company: 'Blámi-hugbúnaður ehf.',
    ceo: 'Jónína Jónsdóttir',
    kennitala: '470301-3920',
    email: 'postur@postur.is',
    isat: '62010 Hugbúnaðargerð',
    ceoGender: 'Kona',
    employees: 45,
  },
  {
    date: '06.12.2025',
    category: 'Úrbótaáætlun',
    company: 'Þrumuþursar ehf.',
    ceo: 'Sigríður Sigurðardóttir',
    kennitala: '550301-2230',
    email: 'sigrid@thrumu.is',
    isat: '45200 Viðgerð ökutækja',
    ceoGender: 'Kona',
    employees: 78,
  },
  {
    date: '06.12.2025',
    category: 'Úrbótaáætlun',
    company: 'Lúxuslúsin ehf.',
    ceo: 'Björn Björnsson',
    kennitala: '640301-5540',
    email: 'bjorn@luxus.is',
    isat: '47710 Verslun með fatnað',
    ceoGender: 'Karl',
    employees: 14,
  },
  {
    date: '06.12.2025',
    category: 'Jafnréttisáætlun',
    company: 'Skvamp & Co.',
    ceo: 'Helga Helgadóttir',
    kennitala: '720301-4410',
    email: 'helga@skvamp.is',
    isat: '73110 Auglýsingastarfsemi',
    ceoGender: 'Kona',
    employees: 22,
  },
  {
    date: '06.12.2025',
    category: 'Úrbótaáætlun',
    company: 'Vafrandi Vöfflur ehf.',
    ceo: 'Páll Pálsson',
    kennitala: '800301-6670',
    email: 'pall@vafrandi.is',
    isat: '56101 Veitingastaðir',
    ceoGender: 'Karl',
    employees: 9,
  },
  {
    date: '29.11.2025',
    category: 'Úrbótaáætlun',
    company: 'Hringlóttur Hamingjubelgur ehf.',
    ceo: 'Anna Sigríður Ólafsdóttir',
    kennitala: '690301-7780',
    email: 'anna@hringlottur.is',
    isat: '85200 Grunnskólakennsla',
    ceoGender: 'Kona',
    employees: 61,
  },
  {
    date: '07.11.2025',
    category: 'Jafnréttisáætlun',
    company: 'Fagrsýn Labs ehf.',
    ceo: 'Kristján Magnússon',
    kennitala: '760301-8890',
    email: 'kristjan@fagrsyn.is',
    isat: '72200 Rannsókna- og þróunarstarfsemi',
    ceoGender: 'Karl',
    employees: 37,
  },
  {
    date: '07.11.2025',
    category: 'Jafnréttisáætlun',
    company: 'Bragðaríka Bröltbúðin ehf.',
    ceo: 'Margrét Einarsdóttir',
    kennitala: '850301-9990',
    email: 'margret@brolt.is',
    isat: '10710 Brauðgerð',
    ceoGender: 'Kona',
    employees: 18,
  },
]

export const COLUMNS: ColumnDef<Case>[] = [
  {
    accessorKey: 'date',
    header: 'Dagsetning',
    enableSorting: true,
  },
  {
    accessorKey: 'category',
    header: 'Flokkur',
    enableSorting: true,
  },
  {
    accessorKey: 'company',
    header: 'Fyrirtæki',
    enableSorting: true,
  },
]

export const DETAIL_FIELDS: Array<{ label: string; key: keyof Case }> = [
  { label: 'Fyrirtæki', key: 'company' },
  { label: 'Æðsti stjórnandi', key: 'ceo' },
  { label: 'Kennitala', key: 'kennitala' },
  { label: 'Netfang', key: 'email' },
  { label: 'ÍSAT atvinnugreinaflokkun', key: 'isat' },
  { label: 'Kyn æðsta stjórnanda', key: 'ceoGender' },
  { label: 'Fjöldi starfsmanna', key: 'employees' },
]
