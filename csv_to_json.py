import pandas as pd
import json
import sys

def top_industry(val):
    #reduce number of industries by merging to base industry.
    #eg. Technology: Software -> Technology

    return val.split(':')[0]

def clean_industry(val):
    #remove trailing whitespaces!

    return val.strip()

class Excel:

    def __init__(self, excel, nanvalue = "nan"):
        self.nanvalue = nanvalue
        self.df = self.clean_excel(excel)
        
        
    def clean_excel(self, excel):
        df = pd.read_excel(excel)
        df.columns = ['company','industry_sub','paid','unpaid']

        df.industry_sub.fillna('Unspecified', inplace=True)
        df.company.fillna('Unspecified', inplace=True)

        df['industry_sub'] = df['industry_sub'].map(lambda x: clean_industry(x))
        df['industry_top'] = df['industry_sub'].map(lambda x: top_industry(x))
        df['parent'] = 'industry'

        df.fillna(self.nanvalue ,inplace=True) #replace paid and unpaid value NaN values
        
        return df
    

    def convert_to_json(self, nanvalue = "nan"):

        df = self.df

        dict_1 = {'key' : 'All Industries', 'count_paid': df.paid.count(),
                  'count_unpaid': df.unpaid.count(),
                  'values': None}

        dict_2 = []

        for top_industry in df.industry_top.unique().tolist():
            d = {'key':'','count_paid':'','count_unpaid':'','values':None}
            d['key'] = top_industry

            sub_industries = df[df['industry_top']==top_industry].industry_sub.unique()
            subset_top = df[df['industry_top']==top_industry]

            d['count_paid'] = subset_top.paid.count()
            d['count_unpaid'] = subset_top.unpaid.count()

            dict_3 = []

            for sub_industry in sub_industries:
                dsub = {'key':'','count_paid':'','count_unpaid':'','values':None}
                dsub['key'] = sub_industry

                companies_sub = df[df['industry_sub']==sub_industry].company.unique()
                subset_sub = df[df['industry_sub']==sub_industry]

                dsub['count_paid'] = subset_sub.paid.count()
                dsub['count_unpaid'] = subset_sub.unpaid.count()

                dict_3.append(dsub) #append each sub industry

                dict_4 = []

                for company in companies_sub:
                    dco = {'key':'','count_paid':'','count_unpaid':'',
                           'paid_mean':'','unpaid_mean':''}
                    dco['key'] = company
                    
                    paid_mean = df[df['company']==company].paid.values[0]
                    unpaid_mean = df[df['company']==company].unpaid.values[0]

                    vals = {('paid_mean', 'count_paid'):paid_mean, 
                        ('unpaid_mean','count_unpaid'):unpaid_mean}

                    for key, val in vals.iteritems():
                        mean_key, count_key = key #unpack key values
                        if val != self.nanvalue: #disregard if not available (nan)
                            dco[mean_key] = val
                            dco[count_key] = 1

                    dict_4.append(dco) #append each sub industry

                dsub['values'] = dict_4

            if len(sub_industries)==1 and sub_industries[0] == top_industry:
                d['values'] = dict_4 #set top industry to values of corresponding sub industries
            else:
                d['values'] = dict_3

            dict_2.append(d) #append each top industry

        dict_1['values'] = dict_2

        return dict_1

    def write_to_json(self):

        converted_dict = self.convert_to_json()
        
        with open('ML_data.json', 'w') as json_file:
            json.dump(converted_dict, json_file, sort_keys = True, indent = 4, ensure_ascii=True)

        print("Finished writing to ML_data.json file")

    
if __name__ == "__main__":

    excel = sys.argv[1]
    
    obj = Excel(excel)

    obj.write_to_json()

    
        

